import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tsr } from "./client";
import { useJoinRoom, useSocket } from "./socket";
import { useMe } from "./me";

/**
 * Generates a favicon with a badge by compositing the original favicon image
 * with a badge overlay using Canvas when the count is greater than zero.
 */
async function generateFaviconWithBadge(count: number): Promise<string> {
  if (count === 0) {
    // Return base favicon path
    return "/favicon.ico";
  }

  try {
    // Get the original favicon
    const faviconLink = document.querySelector(
      'link[rel="icon"]',
    ) as HTMLLinkElement | null;
    const faviconSrc = faviconLink?.href || "/favicon.ico";

    // Create a canvas to composite the favicon and badge
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    // Load and draw the original favicon
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        // Draw favicon
        ctx.drawImage(img, 0, 0, 32, 32);

        // Draw orangered hexagon badge in the top-left corner (matches appBarActive color)
        ctx.fillStyle = "orangered";
        ctx.beginPath();
        const hexCenterX = 8;
        const hexCenterY = 8;
        const hexRadius = 8;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3; // 60 degrees between points
          const x = hexCenterX + hexRadius * Math.cos(angle);
          const y = hexCenterY + hexRadius * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();

        // Draw badge border
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        resolve();
      };
      img.onerror = reject;
      img.src = faviconSrc;
    });

    // Convert canvas to data URL
    return canvas.toDataURL("image/png");
  } catch (error) {
    // Fallback: return base favicon if compositing fails
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(
        "Failed to generate favicon with badge; using fallback favicon instead.",
        error,
      );
    }
    return "/favicon.ico";
  }
}

/**
 * Monitors active games where it's the user's turn and updates the browser tab
 * title and favicon badge accordingly. Integrates with WebSocket for real-time updates.
 */
export function useTabIndicator(): void {
  const me = useMe();
  const socket = useSocket();
  const queryClient = useQueryClient();

  // Join home room to receive game list updates
  useJoinRoom();

  // Construct query with consistent pattern (sorted entries)
  const query = useMemo(
    () => ({
      status: ["ACTIVE"] as ("LOBBY" | "ACTIVE" | "ENDED" | "ABANDONED")[],
      userId: me?.id,
    }),
    [me?.id],
  );

  const queryKeyFromFilter = Object.entries(query)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) =>
      Array.isArray(value)
        ? `${key}:${value.join(",")}`
        : `${key}:${value}`,
    )
    .join(",");

  const queryKey = ["gameList", queryKeyFromFilter];

  // Query for active games only
  const { data } = tsr.games.list.useInfiniteQuery({
    queryKey,
    queryData: ({ pageParam }) => ({
      query: { ...query, pageCursor: pageParam },
    }),
    initialPageParam: undefined,
    getNextPageParam: () => undefined, // Only fetch first page
    enabled: me != null,
  });

  const gameCount = useMemo(() => {
    if (!data || !me) return 0;

    // Get all games from the first page
    const games = data.pages[0]?.body?.games ?? [];

    // Count only games where activePlayerId matches the current user
    return games.filter((game) => game.activePlayerId === me.id).length;
  }, [data, me]);

  // Update document title and favicon
  useEffect(() => {
    if (gameCount > 0) {
      document.title = `Choo Choo Games - Your Turn in ${gameCount} Game${gameCount === 1 ? "" : "s"}`;
    } else {
      document.title = "Choo Choo Games";
    }

    // Update favicon asynchronously
    let cancelled = false;

    const updateFavicon = async () => {
      const faviconHref = await generateFaviconWithBadge(gameCount);

      if (cancelled) return;

      const faviconLink = document.querySelector(
        'link[rel="icon"]',
      ) as HTMLLinkElement | null;

      if (faviconLink) {
        faviconLink.href = faviconHref;
      } else {
        // Create favicon link if it doesn't exist
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = faviconHref;
        document.head.appendChild(link);
      }
    };

    updateFavicon();

    return () => {
      cancelled = true;
    };
  }, [gameCount]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    function handleGameUpdate() {
      // Refetch query when game updates occur
      queryClient.invalidateQueries({ queryKey });
    }

    socket.on("gameUpdateLite", handleGameUpdate);
    socket.on("gameDestroy", handleGameUpdate);

    return () => {
      socket.off("gameUpdateLite", handleGameUpdate);
      socket.off("gameDestroy", handleGameUpdate);
    };
  }, [queryKey, queryClient, socket]);

}

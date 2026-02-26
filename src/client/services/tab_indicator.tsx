import { useEffect, useMemo } from "react";
import { tsr } from "./client";
import { useMe } from "./me";

/**
 * Generates a favicon with a badge by compositing the original favicon image
 * with a numbered badge overlay using Canvas.
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
        const hexRadius = 16;
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
  } catch {
    // Fallback: return base favicon if compositing fails
    return "/favicon.ico";
  }
}

/**
 * Fetches the count of active games where it's the user's turn.
 * Returns the count of games with status=ACTIVE and activePlayerId matching the current user.
 */
export function useTabIndicator(): number {
  const me = useMe();

  // Query for active games only
  const { data } = tsr.games.list.useInfiniteQuery({
    queryKey: ["gameList", `status:ACTIVE`, `userId:${me?.id}`],
    queryData: () => ({
      query: { status: ["ACTIVE"] as const, userId: me?.id },
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
    const updateFavicon = async () => {
      const faviconHref = await generateFaviconWithBadge(gameCount);

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
  }, [gameCount]);

  return gameCount;
}

import { useEffect } from "react";
import { useAwaitingGameIds } from "../components/awaiting_player";

async function generateFaviconWithBadge(count: number): Promise<string> {
  if (count === 0) {
    return "/favicon.ico";
  }

  try {
    const faviconLink = document.querySelector(
      'link[rel="icon"]',
    ) as HTMLLinkElement | null;
    const faviconSrc = faviconLink?.href || "/favicon.ico";

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 32, 32);

        // Draw orangered hexagon badge in the top-left corner (matches appBarActive color)
        ctx.fillStyle = "orangered";
        ctx.beginPath();
        const hexCenterX = 8;
        const hexCenterY = 8;
        const hexRadius = 8;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
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

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        resolve();
      };
      img.onerror = reject;
      img.src = faviconSrc;
    });

    return canvas.toDataURL("image/png");
  } catch (error) {
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

export function useTabIndicator(): void {
  const count = useAwaitingGameIds().size;

  useEffect(() => {
    if (count > 0) {
      document.title = `Choo Choo Games - Your Turn in ${count} Game${count === 1 ? "" : "s"}`;
    } else {
      document.title = "Choo Choo Games";
    }

    let cancelled = false;

    const updateFavicon = async () => {
      const faviconHref = await generateFaviconWithBadge(count);
      if (cancelled) return;

      const faviconLink = document.querySelector(
        'link[rel="icon"]',
      ) as HTMLLinkElement | null;

      if (faviconLink) {
        faviconLink.href = faviconHref;
      } else {
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
  }, [count]);
}

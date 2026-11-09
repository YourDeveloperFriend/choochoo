import { MapPublisher, MapViewSettings } from "../../maps/view_settings";
import { ReactNode } from "react";
import styles from "./credits.module.css";

/**
 * External link to a publisher's site. Intentionally omits rel="noreferrer" so
 * the publisher can see that visitors came from Choo Choo Games; rel="noopener"
 * still guards against window.opener access.
 */
function PublisherLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    // eslint-disable-next-line react/jsx-no-target-blank
    <a href={href} target="_blank" rel="noopener">
      {children}
    </a>
  );
}

function PublisherLogo({ publisher }: { publisher: MapPublisher }) {
  const logos = (
    <>
      <img
        className={styles.logoLight}
        src={publisher.logoSrc}
        alt={publisher.name}
      />
      <img
        className={styles.logoDark}
        src={publisher.darkLogoSrc}
        alt={publisher.name}
      />
    </>
  );
  return publisher.purchaseUrl ? (
    <PublisherLink href={publisher.purchaseUrl}>{logos}</PublisherLink>
  ) : (
    logos
  );
}

export function MapHeader({ map }: { map: MapViewSettings }) {
  const publisher = map.publisher;
  return (
    <div className={styles.header}>
      <h2>{map.name}</h2>
      {publisher && <PublisherLogo publisher={publisher} />}
    </div>
  );
}

export function PublisherCredit({ name, role, purchaseUrl }: MapPublisher) {
  return (
    <p>
      {role} {name}.
      {purchaseUrl && (
        <>
          {" "}
          <PublisherLink href={purchaseUrl}>
            Available for purchase at {new URL(purchaseUrl).hostname}
          </PublisherLink>
          .
        </>
      )}
    </p>
  );
}

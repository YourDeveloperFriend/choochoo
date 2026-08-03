import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Menu,
  MenuItem,
} from "semantic-ui-react";

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export function NotificationHelp() {
  const [expanded, setExpanded] = useState<number | undefined>();

  const toggle = (index: number) =>
    setExpanded(expanded === index ? undefined : index);

  return (
    <Accordion as={Menu} vertical fluid>
      <MenuItem>
        <AccordionTitle
          active={expanded === 0}
          index={0}
          onClick={() => toggle(0)}
          content="How do webhook notifications work?"
        />
        <AccordionContent active={expanded === 0}>
          <p>
            A webhook is a URL that a chat service gives you, which anyone can
            post a message to. When something happens that you should know
            about, Choo Choo Games sends an HTTP POST to that URL and your chat
            service turns it into a message that mentions you.
          </p>
          <p>You&apos;ll get a webhook message when:</p>
          <ul>
            <li>it becomes your turn in a game,</li>
            <li>someone @-pings you in a game chat or in the main chat, or</li>
            <li>one of your games ends.</li>
          </ul>
          <p>
            Once you&apos;ve filled in the fields below, hit{" "}
            <strong>Test</strong> to have us send a test message immediately.
            Note that Test uses the values currently in the form, so you can
            check them before saving.
          </p>
        </AccordionContent>
      </MenuItem>
      <MenuItem>
        <AccordionTitle
          active={expanded === 1}
          index={1}
          onClick={() => toggle(1)}
          content="How do I set up a Discord webhook?"
        />
        <AccordionContent active={expanded === 1}>
          <p>
            The <strong>AoS Discord</strong> and <strong>EoT Discord</strong>{" "}
            options post to the community Discord servers, and{" "}
            <strong>Discord Webhook</strong> posts to a server of your own. All
            three require you to link your Discord account with the{" "}
            <strong>Link Discord</strong> button above, since that&apos;s how we
            learn the user ID needed to mention you.
          </p>
          <p>To create a webhook for your own server:</p>
          <ol>
            <li>
              Use a Discord server where you have administrator privileges, or{" "}
              <ExternalLink href="https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server-">
                create a free one
              </ExternalLink>
              .
            </li>
            <li>
              Follow{" "}
              <ExternalLink href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks">
                Discord&apos;s guide to webhooks
              </ExternalLink>
              : Server Settings &rarr; Integrations &rarr; Webhooks &rarr; New
              Webhook, pick the channel you want notifications in, then{" "}
              <strong>Copy Webhook URL</strong>.
            </li>
            <li>
              Paste it into <strong>Discord Webhook URL</strong> below. It has
              to start with <code>https://discord.com/api/webhooks/</code>.
            </li>
          </ol>
          <p>
            Discord webhooks post to a channel, not to your direct messages. If
            you want notifications privately, make a server that only you are
            in.
          </p>
        </AccordionContent>
      </MenuItem>
      <MenuItem>
        <AccordionTitle
          active={expanded === 2}
          index={2}
          onClick={() => toggle(2)}
          content="How do I set up a custom webhook?"
        />
        <AccordionContent active={expanded === 2}>
          <p>
            <strong>Custom Webhook</strong> is for any service other than
            Discord that accepts a Slack-style incoming webhook. We send an HTTP
            POST whose JSON body looks like this:
          </p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {'{ "text": "<@YOUR_USER_ID> Your turn in [Game name (Map)]' +
              '(https://www.choochoo.games/app/games/123)" }'}
          </pre>
          <p>There are two fields to fill in:</p>
          <ul>
            <li>
              <strong>Webhook URL</strong> &mdash; the full incoming webhook URL
              your service gave you. It must be a valid URL, and it must not be
              a Discord webhook URL (use <strong>Discord Webhook</strong> above
              for those).
            </li>
            <li>
              <strong>Webhook User ID</strong> &mdash; your user ID in that
              service, which we substitute into the message so that it mentions
              you. Enter just the ID, without any <code>@</code> or angle
              brackets.
            </li>
          </ul>
          <p>Two services we know work:</p>
          <ul>
            <li>
              <strong>Slack</strong>: create a Slack app and enable an{" "}
              <ExternalLink href="https://api.slack.com/messaging/webhooks">
                incoming webhook
              </ExternalLink>
              , pointed at a channel or at your own direct messages. Your user
              ID is your Slack member ID (your profile &rarr; the
              &quot;more&quot; menu &rarr; <strong>Copy member ID</strong>),
              which looks like <code>U01ABCDEFG</code>.
            </li>
            <li>
              <strong>Google Chat</strong>: create a webhook in a space (
              <ExternalLink href="https://developers.google.com/workspace/chat/quickstart/webhooks">
                Apps &amp; integrations &rarr; Webhooks
              </ExternalLink>
              ) and use your numeric Google user ID. We add the{" "}
              <code>users/</code> prefix that Google Chat expects, so don&apos;t
              include it yourself.
            </li>
          </ul>
          <p>
            Other services that accept a <code>text</code> field, such as
            Mattermost or Rocket.Chat, generally work too. Bear in mind that we
            format links as Markdown (<code>[label](url)</code>), so a service
            that doesn&apos;t understand Markdown will show the link text
            literally.
          </p>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}

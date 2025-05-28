import Mailjet from "node-mailjet";
import z from "zod";
import { EmailSetting } from "../../api/notifications";
import { MyUserApi } from "../../api/user";
import { log, logError } from "../../utils/functions";
import { decrypt, encrypt } from "./encrypt";
import { environment } from "./environment";
import {
  GamelessTurnNotifySetting,
  MaybeGameTurnNotifySetting,
  TurnNotifyService,
  TurnNotifySetting,
} from "./notify";

abstract class EmailService implements TurnNotifyService<EmailSetting> {
  protected abstract sendEmail(email: SendEmailProps): Promise<void>;
  abstract subscribe(email: string): Promise<void>;
  abstract setIsExcludedFromCampaigns(email: string): Promise<void>;

  protected makeUnsubscribeLink(email: string): string {
    return `https://www.choochoo.games/app/unsubscribe?code=${encrypt(email)}`;
  }

  decryptUnsubscribeCode(code: string): string | undefined {
    return decrypt(code);
  }

  protected makeEmailVerificationCode(email: string): string {
    const expires = new Date();
    expires.setHours(expires.getMinutes() + 30);
    const code: EmailVerificationCode = {
      email,
      expires: expires.getTime(),
    };
    return encrypt(JSON.stringify(code));
  }

  getEmailFromActivationCode(code: string): string | undefined {
    try {
      const decrypted = EmailVerificationCode.parse(JSON.parse(decrypt(code)));
      if (Date.now() > decrypted.expires) return undefined;
      return decrypted.email;
    } catch (_: unknown) {
      return undefined;
    }
  }

  async sendTestNotification({
    user,
  }: GamelessTurnNotifySetting<EmailSetting>): Promise<void> {
    await this.sendEmail({
      email: user.email,
      subject: `Test notification`,
      text: `
This is a test notification from Choo Choo Games.
I hope it finds you well.

- Nathan

This email was sent by Choo Choo games. You can unsubscribe here:
${this.makeUnsubscribeLink(user.email)}
`,
      html: `
<h3>This is a test notification from Choo Choo Games.</h3>
<p>I hope it finds you well.</p>

<p>-Nathan</p>
<p></p>
<p>
  This email was sent by Choo Choo games. You can unsubscribe here:
  <a href="${this.makeUnsubscribeLink(user.email)}">Unsubscribe</a>
</p>`,
    });
  }

  async sendChatMention({
    user,
    game,
  }: MaybeGameTurnNotifySetting<EmailSetting>): Promise<void> {
    if (game == null) return this.sendMainChatMention(user);
    const gameLink = `https://www.choochoo.games/app/games/${game.id}`;
    await this.sendEmail({
      email: user.email,
      subject: `Mentioned on "${game.name}"`,
      text: `
Someone pinged you in the chat for the "${game.name}" game.
Copy and paste the following link to respond: ${gameLink}.
- Nathan

This email was sent by Choo Choo games. You can unsubscribe here:
${this.makeUnsubscribeLink(user.email)}
`,
      html: `
<h3>Someone pinged you in the chat for the <a href="${gameLink}">"${game.name}" game</a>.</h3>
<p>Click or copy and paste the following link to respond.</p>
<p><a href="${gameLink}">Respond</a></p>
<p>-Nathan</p>
<p></p>
<p>
  This email was sent by Choo Choo games. You can unsubscribe here:
  <a href="${this.makeUnsubscribeLink(user.email)}">Unsubscribe</a>
</p>`,
    });
  }

  async sendMainChatMention(user: MyUserApi): Promise<void> {
    const homeLink = `https://www.choochoo.games`;
    await this.sendEmail({
      email: user.email,
      subject: `Mentioned on ChooChoo.games`,
      text: `
Someone pinged you in the main chat of ChooChoo.games.
Copy and paste the following link to respond: ${homeLink}.
- Nathan

This email was sent by Choo Choo games. You can unsubscribe here:
${this.makeUnsubscribeLink(user.email)}
`,
      html: `
<h3>Someone pinged you in the <a href="${homeLink}">main chat</a>.</h3>
<p>Click or copy and paste the following link to respond.</p>
<p><a href="${homeLink}">Respond</a></p>
<p>-Nathan</p>
<p></p>
<p>
  This email was sent by Choo Choo games. You can unsubscribe here:
  <a href="${this.makeUnsubscribeLink(user.email)}">Unsubscribe</a>
</p>`,
    });
  }

  async sendTurnReminder({
    user,
    game,
  }: TurnNotifySetting<EmailSetting>): Promise<void> {
    const gameLink = `https://www.choochoo.games/app/games/${game.id}`;
    await this.sendEmail({
      email: user.email,
      subject: `Update on "${game.name}"`,
      text: `
It's your turn to play!
Everyone in the "${game.name}" game is waiting for you.
Copy and paste the following link to take your turn: ${gameLink}.
- Nathan

This email was sent by Choo Choo games. You can unsubscribe here:
${this.makeUnsubscribeLink(user.email)}
`,
      html: `
<h3>It's your turn to play!</h3>
<p>Everyone in the <a href="${gameLink}">"${game.name}" game</a> is waiting for you.</p>
<p>Click or copy and paste the following link to take your turn.</p>
<p><a href="${gameLink}">Take your turn</a></p>
<p>-Nathan</p>
<p></p>
<p>
  This email was sent by Choo Choo games. You can unsubscribe here:
  <a href="${this.makeUnsubscribeLink(user.email)}">Unsubscribe</a>
</p>`,
    });
  }

  async sendGameEndNotification({
    user,
    game,
  }: TurnNotifySetting<EmailSetting>): Promise<void> {
    const gameLink = `https://www.choochoo.games/app/games/${game.id}`;
    await this.sendEmail({
      email: user.email,
      subject: `Update on "${game.name}"`,
      text: `
The game has ended!
The "${game.name}" game has ended.
Copy and paste the following link to see the final results: ${gameLink}.
- Nathan

This email was sent by Choo Choo games. You can unsubscribe here:
${this.makeUnsubscribeLink(user.email)}
`,
      html: `
<h3>The game has ended!</h3>
<p>The <a href="${gameLink}">"${game.name}" game</a> has ended.</p>
<p>Click or copy and paste the following link to see the final results.</p>
<p><a href="${gameLink}">Final Results</a></p>
<p>-Nathan</p>
<p></p>
<p>
  This email was sent by Choo Choo games. You can unsubscribe here:
  <a href="${this.makeUnsubscribeLink(user.email)}">Unsubscribe</a>
</p>`,
    });
  }

  async sendForgotPasswordMessage(email: string): Promise<void> {
    const code = this.makeEmailVerificationCode(email);
    const updatePasswordLink = `https://www.choochoo.games/app/users/update-password?code=${code}`;
    await this.sendEmail({
      email,
      subject: "Forgotten password request",
      text: `
Let's get you back on the train!
Copy and paste the following link into your browser window to update your password:

${updatePasswordLink}

Good luck! CCMF!
- Nathan

This email was sent by Choo Choo games. You can unsubscribe here:
${this.makeUnsubscribeLink(email)}
`,
      html: `
<h3>Let's get you back on the train!</h3>
<p>Click the following link to update your password.</p>
<p><a href="${updatePasswordLink}">Update password</a></p>
<p>Good luck! CCMF!</p>
<p>- Nathan</p>
<p></p>
<p>
  This email was sent by Choo Choo games. You can unsubscribe here:
  <a href="${this.makeUnsubscribeLink(email)}">Unsubscribe</a>
</p>`,
    });
  }

  async sendActivationCode(email: string): Promise<void> {
    await emailService.subscribe(email);
    const activationCode = this.makeEmailVerificationCode(email);
    const activationLink = `https://www.choochoo.games/app/users/activate?activationCode=${activationCode}`;
    await this.sendEmail({
      email,
      subject: "Activate your account",
      text: `
Welcome to Choo Cho Games!
Copy and paste the following link into your browser window to activate:

${activationLink}

- Nathan

This email was sent by Choo Choo games. You can unsubscribe here:
${this.makeUnsubscribeLink(email)}
`,
      html: `
<h3>Welcome to Choo Choo Games!</h3>
<p>Click the following link to activate your account.</p>
<p><a href="${activationLink}">Activate</a></p>
<p>I hope you enjoy the games! CCMF!</p>
<p>-Nathan</p>
<p></p>
<p>
  This email was sent by Choo Choo games. You can unsubscribe here:
  <a href="${this.makeUnsubscribeLink(email)}">Unsubscribe</a>
</p>`,
    });
  }
}

const EmailVerificationCode = z.object({
  email: z.string(),
  expires: z.number(),
});
type EmailVerificationCode = z.infer<typeof EmailVerificationCode>;

class MailjetEmailService extends EmailService {
  private readonly mailjet: Mailjet;
  constructor(key: string, secret: string) {
    super();
    this.mailjet = Mailjet.apiConnect(key, secret);
  }

  async subscribe(email: string): Promise<void> {
    try {
      await this.mailjet
        .post("contact", { version: "v3" })
        .request({ Email: email, Name: email });
      await this.mailjet.post("listrecipient", { version: "v3" }).request({
        IsUnsubscribed: "false",
        ContactAlt: email,
        ListID: "10484665",
      });
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e != null &&
        "ErrorMessage" in e &&
        (e.ErrorMessage as string[])?.includes("already exists")
      ) {
        return;
      }
      throw e;
    }
  }

  async setIsExcludedFromCampaigns(
    email: string,
    isExcluded = true,
  ): Promise<void> {
    try {
      await this.mailjet
        .put("contact")
        .id(email)
        .request({
          IsExcludedFromCampaigns: isExcluded ? "true" : "false",
        });
    } catch (e: unknown) {
      const alreadyExcluded =
        typeof e === "object" &&
        e != null &&
        "statusCode" in e &&
        e.statusCode === 304 &&
        "statusText" in e &&
        e.statusText == "Content not changed";
      // Ignore errors where the user is already excluded.
      if (alreadyExcluded) return;
      throw e;
    }
  }

  async sendEmail({
    email,
    subject,
    text,
    html,
  }: SendEmailProps): Promise<void> {
    try {
      await this.mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "support@choochoo.games",
              Name: "Choo Choo Games",
            },
            To: [
              {
                Email: email,
                Name: email,
              },
            ],
            Subject: subject,
            TextPart: text,
            HTMLPart: html,
          },
        ],
      });
    } catch (e) {
      logError("failed to send email", e);
    }
  }
}

interface SendEmailProps {
  email: string;
  subject: string;
  text: string;
  html: string;
}

class NoopEmailService extends EmailService {
  async setIsExcludedFromCampaigns(email: string): Promise<void> {
    log("unsubscribing", email);
  }

  async subscribe(email: string): Promise<void> {
    log("subscribing", email);
  }

  protected async sendEmail(email: SendEmailProps): Promise<void> {
    log("sending email", email);
  }
}

export const emailService =
  environment.mailjetKey == null || environment.mailjetSecret == null
    ? new NoopEmailService()
    : new MailjetEmailService(
        environment.mailjetKey,
        environment.mailjetSecret,
      );

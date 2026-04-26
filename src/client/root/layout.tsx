import { Suspense, useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link, Outlet } from "react-router-dom";
import { cssTransition, ToastContainer } from "react-toastify";
import { Button, Dropdown, Icon, Menu, MenuMenu } from "semantic-ui-react";
import { useIsAwaitingPlayer } from "../components/awaiting_player";
import { Loading } from "../components/loading";
import { environment } from "../services/environment";
import { FeedbackForm } from "../services/feedback/form";
import { useReportError } from "../services/feedback/report_error";
import {
  useEnableAdminMode,
  useIsAdmin,
  useLogout,
  useMe,
} from "../services/me";
import { isNetworkError } from "../services/network";
import { useTabIndicator } from "../services/tab_indicator";
import { Banner } from "./banner";
import * as styles from "./layout.module.css";
import { useTheme } from "./theme";

function Offset() {
  return <div style={{ marginTop: "3em" }} />;
}

export function Layout() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const me = useMe();
  const { logout, isPending: isLogoutPending } = useLogout();

  const [enableAdminMode, setEnableAdminMode] = useEnableAdminMode();
  const isAdmin = useIsAdmin(true);
  const isAwaiting = useIsAwaitingPlayer();

  // Update browser tab indicator with count of games awaiting user's turn
  useTabIndicator();

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDarkMode);
  }, [isDarkMode]);

  return (
    <>
      <Menu
        fixed="top"
        className={`${styles.appBar} ${isAwaiting ? styles.appBarActive : ""}`}
      >
        <Menu.Item as={Link} to="/" header>
          Choo Choo Games
        </Menu.Item>

        <MenuMenu position="right">
          {me == null && (
            <Menu.Item as={Link} to="/app/users/login" name="Login">
              Login
            </Menu.Item>
          )}

          {isAdmin && (
            <Dropdown item icon="settings" simple direction="left">
              <Dropdown.Menu>
                <Dropdown.Item
                  onClick={() => {
                    setEnableAdminMode(!enableAdminMode);
                  }}
                >
                  <Icon name={enableAdminMode ? "lock open" : "lock"} />
                  Admin Mode
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/app/admin/feedback">
                  <Icon name="chat" />
                  View Feedback
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/app/admin/users">
                  <Icon name="users" />
                  View users
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
          {me != null && (
            <Dropdown item icon="user circle" simple direction="left">
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to={`/app/users/${me?.id}`}>
                  <Icon name="user" />
                  My Profile
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    toggleDarkMode();
                  }}
                >
                  <Icon name={isDarkMode ? "moon outline" : "moon"} />
                  Dark Mode
                </Dropdown.Item>
                <Dropdown.Item
                  as={Link}
                  to="https://github.com/YourDeveloperFriend/choochoo/issues"
                >
                  <Icon name="chat" />
                  Submit feedback
                </Dropdown.Item>
                <Dropdown.Item onClick={logout} disabled={isLogoutPending}>
                  <Icon name="log out" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </MenuMenu>
      </Menu>
      <Offset />
      <Banner />
      <main className={`${styles.main}`}>
        <Suspense fallback={<Loading />}>
          <ErrorBoundary
            fallbackRender={({ resetErrorBoundary, error }) => (
              <ResetError
                error={error}
                resetErrorBoundary={resetErrorBoundary}
              />
            )}
          >
            <Outlet />
          </ErrorBoundary>
        </Suspense>
      </main>
      <Footer />
      {environment.stage === "test" ? (
        <ToastContainer
          position="bottom-left"
          hideProgressBar
          autoClose={false}
          theme={isDarkMode ? "dark" : "light"}
          transition={cssTransition({
            enter: styles.noop,
            exit: styles.noop,
            collapse: false,
          })}
        />
      ) : (
        <ToastContainer
          position="bottom-left"
          hideProgressBar
          autoClose={2000}
          theme={isDarkMode ? "dark" : "light"}
        />
      )}
    </>
  );
}

function Footer() {
  return (
    <>
      <footer className={styles.footer}>
        <a href="/terms.html" target="_blank">
          Terms of Service
        </a>
        {` • `}
        <a href="/privacy.html" target="_blank">
          Privacy Policy
        </a>
      </footer>
    </>
  );
}

function ResetError({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary(): void;
}) {
  const me = useMe();
  const { reportError, isPending, errorId } = useReportError();
  const [submittedForm, setSubmittedForm] = useState(false);
  useEffect(() => {
    if (me == null || isPending || errorId != null) return;
    if (error == null || isNetworkError(error)) return;
    if (error instanceof Error) {
      reportError({
        url: window.location.toString(),
        stack: error.stack,
        errorMessage: error.message,
      });
      return;
    }
    if (typeof error === "string") {
      reportError({ url: window.location.toString(), errorMessage: error });
      return;
    }
    reportError({
      url: window.location.toString(),
      errorMessage: `Unexpected error message: ${error}`,
    });
  }, [me, error, reportError, isPending, errorId]);

  const close = useCallback(() => {
    setSubmittedForm(true);
  }, [setSubmittedForm]);

  return (
    <div>
      <p>
        Oops! We hit an error. We&apos;re looking into it, don&apos;t worry.
      </p>
      <p>
        You can try refreshing the page and see if it happens again. If that
        doesn&apos;t work, sit tight! This is a work in progress.
      </p>
      {!submittedForm && errorId != null && (
        <p>
          It would be really helpful if you submitted a report describing what
          you were attempting to do.
        </p>
      )}
      {!submittedForm && errorId != null && (
        <FeedbackForm onSubmit={close} errorId={errorId} />
      )}
      {submittedForm && <p>Thanks! We&apos;ll look into it ASAP!</p>}
      <Button onClick={resetErrorBoundary}>Reload</Button>
    </div>
  );
}

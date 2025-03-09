import AccountCircle from "@mui/icons-material/AccountCircle";
import { default as DarkMode } from "@mui/icons-material/DarkMode";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import FeedbackOutlined from "@mui/icons-material/FeedbackOutlined";
import Group from "@mui/icons-material/Group";
import { default as Lock } from "@mui/icons-material/Lock";
import LockOpen from "@mui/icons-material/LockOpen";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import ManageAccounts from "@mui/icons-material/ManageAccounts";
import Person from "@mui/icons-material/Person";
import {
  AppBar,
  Button,
  ListItemIcon,
  MenuList,
  styled,
  Toolbar,
  Typography,
  useColorScheme,
  useMediaQuery,
} from "@mui/material";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useIsAwaitingPlayer } from "../components/awaiting_player";
import { DropdownMenu, DropdownMenuItem } from "../components/dropdown_menu";
import { Loading } from "../components/loading";
import { FeedbackForm } from "../services/feedback/form";
import { useReportError } from "../services/feedback/report_error";
import {
  useEnableAdminMode,
  useIsAdmin,
  useLogout,
  useMe,
} from "../services/me";
import { isNetworkError } from "../services/network";
import { Banner } from "./banner";
import * as styles from "./layout.module.css";
import {useTheme} from "./theme";

const Offset = styled("div")(({ theme }) => theme.mixins.toolbar);

export function Layout() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const me = useMe();
  const { logout, isPending: isLogoutPending } = useLogout();

  const [enableAdminMode, setEnableAdminMode] = useEnableAdminMode();
  const isAdmin = useIsAdmin(true);
  const isAwaiting = useIsAwaitingPlayer();

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDarkMode);
  }, [isDarkMode]);

  return (
    <>
      <AppBar
        position="fixed"
        className={`${styles.appBar} ${isAwaiting ? styles.appBarActive : ""}`}
      >
        <Toolbar>
          <Typography
            color="white"
            style={{ textDecoration: "none" }}
            variant="h6"
            sx={{ flexGrow: 1 }}
            component={Link}
            to="/"
          >
            Choo Choo Games
          </Typography>
          {me == null && (
            <Button color="inherit" component={Link} to="/app/users/login">
              Login
            </Button>
          )}

          {isAdmin && (
            <DropdownMenu
              id="admin-menu"
              icon={<ManageAccounts />}
              ariaLabel="Admin"
            >
              <DropdownMenuItem
                onClick={() => {
                  setEnableAdminMode(!enableAdminMode);
                }}
              >
                <ListItemIcon>
                  {enableAdminMode ? (
                    <LockOpen fontSize="small" />
                  ) : (
                    <Lock fontSize="small" />
                  )}
                </ListItemIcon>
                Admin Mode
              </DropdownMenuItem>
              <DropdownMenuItem component={Link} to="/app/admin/feedback">
                <ListItemIcon>
                  <FeedbackOutlined fontSize="small" />
                </ListItemIcon>
                View Feedback
              </DropdownMenuItem>
              <DropdownMenuItem component={Link} to="/app/admin/users">
                <ListItemIcon>
                  <Group fontSize="small" />
                </ListItemIcon>
                View users
              </DropdownMenuItem>
            </DropdownMenu>
          )}

          {me != null && (
            <DropdownMenu
              id="user-menu"
              icon={<AccountCircle />}
              ariaLabel="Account of current user"
            >
              <MenuList>
                <DropdownMenuItem component={Link} to={`/app/users/${me?.id}`}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    toggleDarkMode()
                  }}
                >
                  <ListItemIcon>
                    {isDarkMode ? (
                      <DarkMode fontSize="small" />
                    ) : (
                      <DarkModeOutlined fontSize="small" />
                    )}
                  </ListItemIcon>
                  Dark Mode
                </DropdownMenuItem>
                <DropdownMenuItem
                  component={Link}
                  to={"https://github.com/YourDeveloperFriend/choochoo/issues"}
                  target="_blank"
                >
                  <ListItemIcon>
                    <FeedbackOutlined fontSize="small" />
                  </ListItemIcon>
                  Submit feedback
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} disabled={isLogoutPending}>
                  <ListItemIcon>
                    <LogoutOutlined fontSize="small" />
                  </ListItemIcon>
                  Logout
                </DropdownMenuItem>
              </MenuList>
            </DropdownMenu>
          )}
        </Toolbar>
      </AppBar>
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
      <ToastContainer
        position="bottom-left"
        hideProgressBar
        autoClose={2000}
        theme={mode}
      />
    </>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <a href="/terms.html" target="_blank">
        Terms of Service
      </a>
      {` • `}
      <a href="/privacy.html" target="_blank">
        Privacy Policy
      </a>
    </footer>
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

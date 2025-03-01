import { Button, createTheme, ThemeProvider } from "@mui/material";
import {
  QueryClient,
  QueryClientProvider,
  useQueryErrorResetBoundary,
} from "@tanstack/react-query";
import { DialogsProvider, NotificationsProvider } from "@toolpad/core";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AwaitingContextProvider } from "../components/awaiting_player";
import { Loading } from "../components/loading";
import { tsr } from "../services/client";
import { AdminModeProvider } from "../services/me";
import { SocketContextProvider } from "../services/socket";
import { Router } from "./routes";

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  colorSchemes: {
    light: true,
    dark: true,
  },
});

export function App() {
  const queryClient = useMemo(() => new QueryClient(), [1]);
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <ResetError resetErrorBoundary={resetErrorBoundary} />
      )}
    >
      <Suspense fallback={<Loading />}>
        <SocketContextProvider>
          <ThemeProvider theme={theme}>
            <DialogsProvider>
              <NotificationsProvider>
                <AwaitingContextProvider>
                  <QueryClientProvider client={queryClient}>
                    <tsr.ReactQueryProvider>
                      <AdminModeProvider>
                        <Router />
                      </AdminModeProvider>
                    </tsr.ReactQueryProvider>
                  </QueryClientProvider>
                </AwaitingContextProvider>
              </NotificationsProvider>
            </DialogsProvider>
          </ThemeProvider>
        </SocketContextProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

function ResetError({ resetErrorBoundary }: { resetErrorBoundary(): void }) {
  return (
    <div>
      There was an error!
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
}

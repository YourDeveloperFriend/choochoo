import { Button, createTheme, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { DialogsProvider, NotificationsProvider } from "@toolpad/core";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AwaitingContextProvider } from "../components/awaiting_player";
import { Loading } from "../components/loading";
import { tsr } from '../services/client';
import { AdminModeProvider } from "../services/me";
import { Router } from "./routes";


const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class'
  },
  colorSchemes: {
    light: true,
    dark: true,
  },
});

export function App() {
  const queryClient = useMemo(() => new QueryClient(), [1]);
  const { reset } = useQueryErrorResetBoundary();

  return <Suspense fallback={<Loading />}>
    <AdminModeProvider>
      <ThemeProvider theme={theme}>
        <DialogsProvider>
          <NotificationsProvider>
            <AwaitingContextProvider>
              <ErrorBoundary onReset={reset} fallbackRender={({ resetErrorBoundary }) => <ResetError resetErrorBoundary={resetErrorBoundary} />}>
                <QueryClientProvider client={queryClient}>
                  <tsr.ReactQueryProvider>
                    <Router />
                  </tsr.ReactQueryProvider>
                </QueryClientProvider>
              </ErrorBoundary>
            </AwaitingContextProvider>
          </NotificationsProvider>
        </DialogsProvider>
      </ThemeProvider>
    </AdminModeProvider>
  </Suspense>;
}

function ResetError({ resetErrorBoundary }: { resetErrorBoundary(): void }) {
  return <div>
    There was an error!
    <Button onClick={resetErrorBoundary}>Try again</Button>
  </div>;
}
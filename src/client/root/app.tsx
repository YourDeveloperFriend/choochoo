import {
  QueryClient,
  QueryClientProvider,
  useQueryErrorResetBoundary,
} from "@tanstack/react-query";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AwaitingContextProvider } from "../components/awaiting_player";
import { DialogsProvider } from "../components/confirm";
import { Loading } from "../components/loading";
import { tsr } from "../services/client";
import { AdminModeProvider } from "../services/me";
import { SocketContextProvider } from "../services/socket";
import { Router } from "./routes";
import {ThemeProvider} from "./theme";
import {Button} from "semantic-ui-react";

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
          <ThemeProvider>
            <DialogsProvider>
              <AwaitingContextProvider>
                <QueryClientProvider client={queryClient}>
                  <tsr.ReactQueryProvider>
                    <AdminModeProvider>
                      <Router />
                    </AdminModeProvider>
                  </tsr.ReactQueryProvider>
                </QueryClientProvider>
              </AwaitingContextProvider>
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
      <Button primary onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
}

import { default as AppBar } from "@mui/material/AppBar";
import { default as Box } from "@mui/material/Box";
import { default as Button } from "@mui/material/Button";
import { styled } from '@mui/material/styles';
import { default as Toolbar } from "@mui/material/Toolbar";
import { default as Typography } from "@mui/material/Typography";
import { Link, Outlet } from "react-router-dom";
import { useLogout, useMe } from "../services/me";
import { Banner } from "./banner";
import { main } from './layout.module.css';

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

export function Layout() {
  const me = useMe();
  const { logout, isPending } = useLogout();
  return <div>
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography color="white" style={{ textDecoration: 'none' }} variant="h6" sx={{ flexGrow: 1 }} component={Link} to="/">
            Choo Choo Games
          </Typography>
          {me == null ?
            <Button color="inherit" component={Link} to="/app/users/login">Login</Button> :
            <Button color="inherit" onClick={logout} disabled={isPending}>Logout</Button>}
        </Toolbar>
      </AppBar>
    </Box>
    <Offset />
    <Banner />
    <main className={main}>
      <Outlet />
    </main>
  </div>;
}
import "./App.css";
import Main from "./layout/Main.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
import StaffsPage from "./pages/StaffsPage.tsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route>
        <Route path="/" element={<LoginPage></LoginPage>}></Route>
      </Route>
      <Route path="/" element={<Main />}>
        <Route
          path="dashboard"
          element={<DashboardPage></DashboardPage>}
        ></Route>
        <Route path="staffs" element={<StaffsPage></StaffsPage>}></Route>
      </Route>
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

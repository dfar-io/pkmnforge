import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UpdateNotifier } from "@/components/UpdateNotifier";
import { TeamProvider } from "@/context/TeamContext";
import AppLayout from "@/components/AppLayout";
import TeamPage from "./pages/TeamPage";
import PokedexPage from "./pages/PokedexPage";
import PokemonDetailPage from "./pages/PokemonDetailPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UpdateNotifier />
      <BrowserRouter>
        <TeamProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<TeamPage />} />
              <Route path="/pokedex" element={<PokedexPage />} />
              <Route path="/pokedex/:id" element={<PokemonDetailPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TeamProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

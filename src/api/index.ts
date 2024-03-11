import AppApi from './AppApi';
import ServicesApi from './ServicesApi';
import RecipePreviewsApi from './RecipePreviewsApi';
import RecipesApi from './RecipesApi';
import UserApi from './UserApi';
import LocalApi from './LocalApi';
import FeaturesApi from './FeaturesApi';
import ThemesApi from './ThemesApi';

export interface ApiInterface {
  app: AppApi;
  services: ServicesApi;
  recipePreviews: RecipePreviewsApi;
  recipes: RecipesApi;
  features: FeaturesApi;
  themes: ThemesApi;
  user: UserApi;
  local: LocalApi;
}

export default (server: any, local: any): ApiInterface => ({
  app: new AppApi(server),
  services: new ServicesApi(server, local),
  recipePreviews: new RecipePreviewsApi(server),
  recipes: new RecipesApi(server),
  features: new FeaturesApi(server),
  themes: new ThemesApi(server),
  user: new UserApi(server, local),
  local: new LocalApi(server, local),
});

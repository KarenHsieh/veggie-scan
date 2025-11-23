import { postFilterIngredients } from "../../../server/controllers/filterIngredientsController";

export async function POST(req) {
  return postFilterIngredients(req);
}

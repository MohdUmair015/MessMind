import { MealsTimelineView } from "@/components/meals/MealsTimelineView";

export default async function MealsPage() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  let meals: any[] = [];

  if (isDemo) {
    const { demoDataProvider } = await import("@/modules/demo-data");
    const result = demoDataProvider.getMealsList({
      filter: "all",
      limit: 50,
    });
    meals = result.meals;
  } else {
    const { mealService } = await import("@/modules/meals/meal-service");
    const result = await mealService.getMealsList({
      filter: "all",
      limit: 50,
    });
    meals = result.meals;
  }

  return <MealsTimelineView allMeals={meals} />;
}

import {
  Activity,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Heart,
  Image,
  Ruler,
  Scale,
  Settings2,
  Target,
  TrendingUp,
  Users,
  Utensils,
} from "lucide-react";
export const toolGroups = [
  {
    id: "training",
    title: "Training",
    items: [
      {
        to: "/routines",
        title: "Routines",
        description: "Your ready-to-go sessions",
        icon: ClipboardList,
      },
      {
        to: "/workouts",
        title: "Workout journal",
        description: "Every set, saved",
        icon: Dumbbell,
      },
      {
        to: "/exercises",
        title: "Exercise library",
        description: "Build your movement collection",
        icon: Activity,
      },
      {
        to: "/goals",
        title: "Weekly goals",
        description: "A rhythm that fits your life",
        icon: Target,
      },
      {
        to: "/schedule",
        title: "Schedule",
        description: "Make room for your next session",
        icon: CalendarDays,
      },
      {
        to: "/calendar",
        title: "Activity calendar",
        description: "Your days at a glance",
        icon: CalendarDays,
      },
      {
        to: "/overload",
        title: "Next progression",
        description: "Find your next small step",
        icon: TrendingUp,
      },
      {
        to: "/muscles",
        title: "Muscle balance",
        description: "See where your sets add up",
        icon: Activity,
      },
      {
        to: "/alternatives",
        title: "Alternatives",
        description: "A different way to move",
        icon: Dumbbell,
      },
    ],
  },
  {
    id: "wellbeing",
    title: "Wellbeing",
    items: [
      {
        to: "/protein",
        title: "Protein & nutrition",
        description: "Fuel your day, your way",
        icon: Utensils,
      },
      {
        to: "/body-weight",
        title: "Body weight",
        description: "Keep each number in context",
        icon: Scale,
      },
      {
        to: "/recovery",
        title: "Recovery check-in",
        description: "Sleep, energy and how you feel",
        icon: Heart,
      },
      {
        to: "/measurements",
        title: "Measurements",
        description: "More ways to see your progress",
        icon: Ruler,
      },
      {
        to: "/photos",
        title: "Progress photos",
        description: "Your private visual journal",
        icon: Image,
      },
    ],
  },
  {
    id: "you",
    title: "Your space",
    items: [
      {
        to: "/progress",
        title: "Progress & milestones",
        description: "Your personal bests and small wins",
        icon: TrendingUp,
      },
      {
        to: "/together",
        title: "Together",
        description: "Good company, shared progress",
        icon: Users,
      },
      {
        to: "/profile",
        title: "Profile & security",
        description: "Your details and preferences",
        icon: Settings2,
      },
    ],
  },
];

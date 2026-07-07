import { ActivityIcon, BarChart3Icon, FolderOpenIcon } from "lucide-react";

export const DEFAULT_AVATAR_URL = "https://api.dicebear.com/8.x/initials/svg?backgroundType=gradientLinear&backgroundRotation=0,360&seed=";

export const PAGINATION_LIMIT = 10;

export const COMPANIES = [
    {
        name: "Asana",
        logo: "/assets/company-01.svg",
    },
    {
        name: "Tidal",
        logo: "/assets/company-02.svg",
    },
    {
        name: "Innovaccer",
        logo: "/assets/company-03.svg",
    },
    {
        name: "Linear",
        logo: "/assets/company-04.svg",
    },
    {
        name: "Raycast",
        logo: "/assets/company-05.svg",
    },
    {
        name: "Labelbox",
        logo: "/assets/company-06.svg",
    }
] as const;

export const PROCESS = [
    {
        title: "Connect Your Providers",
        description: "Link OpenAI, Stripe, GitHub and more, then import your API keys for centralized visibility.",
        icon: FolderOpenIcon,
    },
    {
        title: "Track and Monitor",
        description: "Watch key health, usage, and spend in real time with automated health checks.",
        icon: ActivityIcon,
    },
    {
        title: "Analyze and Optimize",
        description: "Gain insights into key performance and get alerts before anything breaks.",
        icon: BarChart3Icon,
    },
] as const;

export const FEATURES = [
    {
        title: "Key tracking",
        description: "Track every API key across all your providers in one place.",
    },
    {
        title: "Health monitoring",
        description: "Automated checks that catch failing keys before your users do.",
    },
    {
        title: "Expiry alerts",
        description: "Get notified before keys expire or hit their quota.",
    },
    {
        title: "Usage analytics",
        description: "Track requests, tokens, and spend for every key.",
    },
    {
        title: "Budget controls",
        description: "Set monthly budgets per key and stop surprise bills.",
    },
    {
        title: "Team collaboration",
        description: "Share key visibility with your team and collaborate in real-time.",
    },
] as const;

export const REVIEWS = [
    {
        name: "Michael Smith",
        username: "@michaelsmith",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        rating: 5,
        review: "This tool is a lifesaver! Managing and tracking my API keys has never been easier. A must-have for anyone juggling multiple providers."
    },
    {
        name: "Emily Johnson",
        username: "@emilyjohnson",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
        rating: 4,
        review: "Very useful app! It has streamlined my workflow considerably. A few minor bugs, but overall a great experience."
    },
    {
        name: "Daniel Williams",
        username: "@danielwilliams",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
        rating: 5,
        review: "I've been using this app daily for months. The insights and analytics it provides are invaluable. Highly recommend it!"
    },
    {
        name: "Sophia Brown",
        username: "@sophiabrown",
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
        rating: 4,
        review: "This app is fantastic! It offers everything I need to manage my API keys efficiently."
    },
    {
        name: "James Taylor",
        username: "@jamestaylor",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
        rating: 5,
        review: "Absolutely love this app! It's intuitive and feature-rich. Has significantly improved how I monitor and track API keys."
    },
    {
        name: "Olivia Martinez",
        username: "@oliviamartinez",
        avatar: "https://randomuser.me/api/portraits/women/3.jpg",
        rating: 4,
        review: "Great app with a lot of potential. It has already saved me a lot of time. Looking forward to future updates and improvements."
    },
    {
        name: "William Garcia",
        username: "@williamgarcia",
        avatar: "https://randomuser.me/api/portraits/men/4.jpg",
        rating: 5,
        review: "This app is a game-changer for API key management. It's easy to use, extremely powerful and highly recommended!"
    },
    {
        name: "Mia Rodriguez",
        username: "@miarodriguez",
        avatar: "https://randomuser.me/api/portraits/women/4.jpg",
        rating: 4,
        review: "I've tried several API key management tools, but this one stands out. It's simple, effective."
    },
    {
        name: "Henry Lee",
        username: "@henrylee",
        avatar: "https://randomuser.me/api/portraits/men/5.jpg",
        rating: 5,
        review: "This app has transformed my workflow. Monitoring and analyzing API keys is now a breeze. I can't imagine working without it."
    },
] as const;

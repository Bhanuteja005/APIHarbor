import { ActivityIcon, BellRingIcon, HelpCircleIcon, KeyRoundIcon, LineChartIcon, NewspaperIcon } from "lucide-react";

export const NAV_LINKS = [
    {
        title: "Features",
        href: "/features",
        menu: [
            {
                title: "Key Tracking",
                tagline: "Track every API key and its health in one place.",
                href: "/features/key-tracking",
                icon: KeyRoundIcon,
            },
            {
                title: "Health Monitoring",
                tagline: "Automated checks that catch failing keys early.",
                href: "/features/health-monitoring",
                icon: ActivityIcon,
            },
            {
                title: "Usage Analytics",
                tagline: "Gain insights into how your keys are used.",
                href: "/features/analytics",
                icon: LineChartIcon,
            },
            {
                title: "Expiry Alerts",
                tagline: "Never get caught out by an expired key.",
                href: "/features/expiry-alerts",
                icon: BellRingIcon,
            },
        ],
    },
    {
        title: "Pricing",
        href: "/pricing",
    },
    {
        title: "Enterprise",
        href: "/enterprise",
    },
    {
        title: "Resources",
        href: "/resources",
        menu: [
            {
                title: "Blog",
                tagline: "Read articles on the latest trends in tech.",
                href: "/resources/blog",
                icon: NewspaperIcon,
            },
            {
                title: "Help",
                tagline: "Get answers to your questions.",
                href: "/resources/help",
                icon: HelpCircleIcon,
            },
        ]
    },
    {
        title: "Changelog",
        href: "/changelog",
    },
];

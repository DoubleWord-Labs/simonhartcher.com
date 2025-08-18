import { useEffect, useState } from "react";
import Giscus from "@giscus/react";

interface CommentsProps {
    className?: string;
    postTitle?: string;
}

export default function Comments({ className, postTitle }: CommentsProps) {
    const [theme, setTheme] = useState<string>("light");
    const [mounted, setMounted] = useState(false);

    // Get configuration from environment variables with fallbacks
    const repo = import.meta.env.PUBLIC_GISCUS_REPO;
    const repoId = import.meta.env.PUBLIC_GISCUS_REPO_ID;
    const category = import.meta.env.PUBLIC_GISCUS_CATEGORY || "Comments";
    const categoryId = import.meta.env.PUBLIC_GISCUS_CATEGORY_ID;

    useEffect(() => {
        setMounted(true);

        // Detect initial theme from Pico CSS data attributes or media query
        const detectTheme = () => {
            // Check if there's a theme preference stored
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme === "dark") return "catppuccin_mocha";
            if (savedTheme === "light") return "catppuccin_latte";

            // Check for Pico CSS dark mode indicators
            const htmlElement = document.documentElement;
            const hasDataTheme = htmlElement.getAttribute("data-theme");
            if (hasDataTheme === "dark") return "catppuccin_mocha";

            // Fallback to system preference
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                return "catppuccin_mocha";
            }
            return "catppuccin_latte";
        };

        setTheme(detectTheme());

        // Listen for theme changes
        const handleThemeChange = () => {
            setTheme(detectTheme());
        };

        // Watch for data-theme attribute changes on html element
        const observer = new MutationObserver(() => {
            handleThemeChange();
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme", "class"],
        });

        // Listen for localStorage changes (theme switching)
        window.addEventListener("storage", handleThemeChange);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", handleThemeChange);

        return () => {
            observer.disconnect();
            window.removeEventListener("storage", handleThemeChange);
            mediaQuery.removeEventListener("change", handleThemeChange);
        };
    }, []);

    // Don't render on server or if required config is missing
    if (!mounted || !repo || !repoId || !categoryId) {
        return (
            <div className={`comments-container ${className || ""}`}>
                <div className="comments-loading">
                    {!repo || !repoId || !categoryId ? (
                        <p>
                            Comments are not configured. Please set up Giscus
                            environment variables.
                        </p>
                    ) : (
                        <p>Loading comments...</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`comments-container ${className || ""}`}>
            <div className="comments-header">
                <h3>Comments</h3>
                <p>
                    Join the discussion below! Comments are powered by GitHub
                    Discussions.
                </p>
            </div>

            <div className="giscus-container">
                <Giscus
                    id="comments"
                    repo={repo}
                    repoId={repoId}
                    category={category}
                    categoryId={categoryId}
                    mapping="specific"
                    term={postTitle || ""}
                    strict="1"
                    reactionsEnabled="1"
                    emitMetadata="1"
                    inputPosition="top"
                    theme={theme}
                    lang="en"
                    loading="lazy"
                />
            </div>
        </div>
    );
}

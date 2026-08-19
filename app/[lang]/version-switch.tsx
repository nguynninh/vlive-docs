"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const VERSIONS_API_URL = "https://api-docs-mobile.vtvlive.vn/api/paths";

type VersionApiItem = {
  tag: string;
  path: string;
  url: string;
  port: string;
  running: boolean;
};

type Version = { label: string; basePath: string };

const FALLBACK_VERSIONS: Version[] = [{ label: "latest", basePath: "/" }];

export function VersionSwitch() {
  const pathname = usePathname();
  const [versions, setVersions] = useState<Version[]>(FALLBACK_VERSIONS);

  useEffect(() => {
    let cancelled = false;

    fetch(VERSIONS_API_URL)
      .then((res) => res.json())
      .then((data: { items: VersionApiItem[] }) => {
        if (cancelled) return;
        const running = data.items
          .filter((item) => item.running)
          .map((item) => ({
            label: item.tag.replace(/^v/, ""),
            basePath: item.path,
          }));
        if (running.length > 0) setVersions(running);
      })
      .catch(() => {
        // giữ nguyên FALLBACK_VERSIONS nếu API lỗi
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const active =
    versions.find((v) => v.basePath !== "/" && pathname.startsWith(v.basePath)) ?? versions[0];

  // Chỉ 1 bản đang chạy thì hiện nhãn tĩnh, không cần dropdown để bấm.
  if (versions.length < 2) {
    return (
      <span className="nextra-lang-switch-button" aria-disabled>
        {active.label}
      </span>
    );
  }

  const stripBasePath = (path: string) => {
    const current = versions.find((v) => v.basePath && path.startsWith(v.basePath));
    return current ? path.slice(current.basePath.length) || "/" : path;
  };

  const restOfPath = stripBasePath(pathname);

  return (
    <Menu as="div" className="nextra-lang-switch">
      <MenuButton className="nextra-lang-switch-button">
        {active.label}
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </MenuButton>
      <MenuItems anchor={{ to: "bottom end", gap: 10, padding: 16 }} className="nextra-lang-switch-items">
        {versions.map((version) => {
          const isActive = version.label === active.label;
          const href = `${version.basePath}${restOfPath}`;
          return (
            <MenuItem key={version.label} as="a" href={href}>
              {({ focus }) => (
                <span
                  className="nextra-lang-switch-item nextra-lang-switch-item-link"
                  data-focus={focus || undefined}
                  data-active={isActive || undefined}
                >
                  {version.label}
                </span>
              )}
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}

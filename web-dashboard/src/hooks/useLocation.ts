import { useState, useEffect } from "react";
import { useLocation as useWouterLocation } from "wouter";

const BASE_PATH = "/tiktok-automation-platform";

export function useLocation(): [string, (path: string) => void] {
  const [wouterPath, setWouterPath] = useWouterLocation();

  // Strip base path from the beginning of the path
  const strippedPath =
    wouterPath.startsWith(BASE_PATH)
      ? wouterPath.slice(BASE_PATH.length) || "/"
      : wouterPath;

  // Wrap setPath to add base path back when navigating
  const setPath = (path: string) => {
    if (path.startsWith("/") && !path.startsWith(BASE_PATH)) {
      setWouterPath(BASE_PATH + path);
    } else {
      setWouterPath(path);
    }
  };

  return [strippedPath, setPath];
}

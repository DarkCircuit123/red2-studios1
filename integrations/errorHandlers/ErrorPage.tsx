import { useRouteError } from "react-router";
import { useEffect } from "react";
import { ErrorOverlay, sendErrorToParent } from "../../vite-error-overlay-plugin";

export default function ErrorPage() {
  const error = useRouteError() as Error;

  useEffect(() => {
    sendErrorToParent(error);
  }, [error]);

  return (
    <div className="w-full h-full bg-white flex items-center justify-center gap">
      <div dangerouslySetInnerHTML={{ __html: ErrorOverlay.getOverlayHTML() }} />
    </div>
  );
};

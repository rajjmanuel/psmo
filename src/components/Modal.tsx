"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useState, type ReactNode } from "react";

type ModalChildren = ReactNode | ((helpers: { close: () => void }) => ReactNode);

export function ModalTrigger({
  label,
  title,
  description,
  children,
  variant = "primary",
  buttonClassName = "",
}: {
  label: string;
  title: string;
  description?: string;
  children: ModalChildren;
  variant?: "primary" | "ghost";
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const close = () => setOpen(false);
  const content = typeof children === "function" ? children({ close }) : children;
  // align/justify-self-start prevents CSS grid & flex parents from stretching the button.
  const triggerClass = `${variant === "primary" ? "btn-primary" : "btn-ghost"} align-self-start justify-self-start max-w-full ${buttonClassName}`.trim();

  const modal = open ? (
    <>
      <div className="modal-backdrop fade show bootstrap-modal-backdrop" onClick={close} />
      <div
        className="modal fade show d-block bootstrap-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <p className="modal-kicker">PSMO transaction</p>
                <h2 id={titleId} className="modal-title">
                  {title}
                </h2>
                {description ? <p className="modal-description">{description}</p> : null}
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close modal"
                onClick={close}
              />
            </div>
            <div className="modal-body modal-content-readable">{content}</div>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        {label}
      </button>
      {modal && typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}

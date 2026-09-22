import React, { type ReactNode } from "react";
import type { adminCopy } from "@/lib/miniapp/adminCopy";
import {
  applicantSections,
  applicationMetaSection,
  displayApplicantValue,
  type ApplicantProfileView,
  type ApplicationMeta,
} from "@/lib/miniapp/applicantProfileView";

export type ApplicantPhotoView = {
  id: string;
  photo_status?: string;
  status?: string;
  review?: {
    status?: string;
    issues?: Array<{ message?: string; type?: string }>;
    quality?: string | null;
    face_visible?: boolean;
    main_person_detected?: boolean;
    admin_override?: string | null;
    has_annotation?: boolean;
  } | null;
};

type Copy = (typeof adminCopy)["en"];

type Props = {
  t: Copy;
  applicant?: ApplicantProfileView | null;
  photos?: ApplicantPhotoView[] | null;
  application?: ApplicationMeta | null;
  statusOf: (value?: string | null) => string;
  renderPhoto: (id: string, large?: boolean) => ReactNode;
  renderAnnotation?: (id: string) => ReactNode;
  photoActions?: (photo: ApplicantPhotoView) => ReactNode;
};

function fieldLabel(t: Copy, key: string) {
  return t.applicant[key as keyof Copy["applicant"]] || key;
}

export function ApplicantQuestionnaire({
  t,
  applicant,
  photos,
  application,
  statusOf,
  renderPhoto,
  renderAnnotation,
  photoActions,
}: Props) {
  const emptyLabels = {
    yes: t.photo.yes,
    no: t.photo.no,
    empty: t.applicant.empty,
  };

  return (
    <div className="space-y-4">
      {applicantSections(applicant).map((sectionItem) => (
        <section key={sectionItem.id} className="space-y-3 border border-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.applicant[sectionItem.id]}</p>
          {sectionItem.fields.map((field) => (
            <div key={field.key} className="text-sm leading-relaxed">
              <p className="text-ivory/50">{fieldLabel(t, field.key)}</p>
              <p className="whitespace-pre-wrap break-words text-ivory/90">
                {displayApplicantValue(field.value, emptyLabels)}
              </p>
            </div>
          ))}
        </section>
      ))}

      <section className="space-y-3 border border-white/10 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.applicant.photos}</p>
        {photos?.length ? (
          photos.map((photo) => (
            <article key={photo.id} className="space-y-2 border border-white/10 p-3">
              {renderPhoto(photo.id, true)}
              {photo.review?.has_annotation && renderAnnotation ? renderAnnotation(photo.id) : null}
              <p className="text-xs uppercase text-gold">
                {statusOf(photo.review?.status || photo.photo_status || photo.status)}
              </p>
              {photo.review?.status === "AI_UNAVAILABLE" ? (
                <p className="text-sm text-ivory/70">{t.photo.unavailable}</p>
              ) : null}
              {photo.review ? (
                <div className="space-y-1 text-sm leading-relaxed text-ivory/70">
                  <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.applicant.photoReview}</p>
                  <p>
                    {t.photo.face}: {photo.review.face_visible ? t.photo.yes : t.photo.no}
                  </p>
                  <p>
                    {t.photo.person}: {photo.review.main_person_detected ? t.photo.yes : t.photo.no}
                  </p>
                  <p>
                    {t.photo.quality}: {photo.review.quality || t.applicant.empty}
                  </p>
                  {photo.review.admin_override ? (
                    <p>
                      {t.photo.decision}: {statusOf(photo.review.admin_override)}
                    </p>
                  ) : null}
                  {photo.review.issues?.map((issue, index) => (
                    <p key={`${photo.id}-issue-${index}`}>{issue.message || issue.type}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ivory/60">{t.photo.waiting}</p>
              )}
              {photoActions ? photoActions(photo) : null}
            </article>
          ))
        ) : (
          <p className="text-sm text-ivory/50">{t.applicant.noPhotos}</p>
        )}
      </section>

      <section className="space-y-3 border border-white/10 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-gold">{t.applicant.application}</p>
        {applicationMetaSection(application).fields.map((field) => (
          <div key={field.key} className="text-sm leading-relaxed">
            <p className="text-ivory/50">{fieldLabel(t, field.key)}</p>
            <p className="whitespace-pre-wrap break-words text-ivory/90">
              {field.key === "status"
                ? statusOf(typeof field.value === "string" ? field.value : "")
                : displayApplicantValue(field.value, emptyLabels)}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

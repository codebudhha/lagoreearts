import React from 'react';
import { Card } from '../ui/Card';
import { SanskritEditProfile } from '../../lib/api/sanskritEdit';
import { Volume2 } from 'lucide-react';

interface SanskritTextCardProps {
  profile: SanskritEditProfile;
  className?: string;
}

export const SanskritTextCard: React.FC<SanskritTextCardProps> = ({
  profile,
  className,
}) => {
  return (
    <Card className={`p-6 space-y-6 ${className || ''}`}>
      {/* Sanskrit & Devanagari Heading */}
      <div className="text-center space-y-2 pb-4 border-b border-sand-200">
        {profile.sanskritTitle && (
          <h3 className="text-sm font-semibold tracking-wider text-champagne-700 uppercase font-sans">
            {profile.sanskritTitle}
          </h3>
        )}

        {profile.devanagariText ? (
          <div className="text-2xl sm:text-3xl font-serif text-charcoal-950 font-bold leading-relaxed tracking-wide px-4 py-3 bg-sand-50/80 rounded-xl border border-sand-200">
            {profile.devanagariText}
          </div>
        ) : (
          <p className="text-xs text-charcoal-400 italic">No Devanagari verse recorded.</p>
        )}

        {profile.transliteration && (
          <p className="text-sm font-serif italic text-charcoal-700 font-medium">
            {profile.transliteration}
          </p>
        )}

        {profile.pronunciation && (
          <div className="inline-flex items-center gap-1.5 text-xs text-charcoal-500 bg-sand-100/60 px-2.5 py-1 rounded-full">
            <Volume2 className="w-3.5 h-3.5 text-champagne-600" />
            <span>{profile.pronunciation}</span>
          </div>
        )}
      </div>

      {/* Translation & Philosophical Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700 font-sans block">
            English Translation
          </span>
          <p className="text-sm font-serif text-charcoal-800 leading-relaxed bg-sand-50/40 p-4 rounded-lg border border-sand-200/80">
            {profile.translation || <span className="text-charcoal-400 italic">No translation entered.</span>}
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700 font-sans block">
            Philosophical Significance & Meaning
          </span>
          <p className="text-sm font-serif text-charcoal-800 leading-relaxed bg-sand-50/40 p-4 rounded-lg border border-sand-200/80">
            {profile.meaning || <span className="text-charcoal-400 italic">No interpretation entered.</span>}
          </p>
        </div>
      </div>

      {/* Source Lineage & Theme Badges */}
      {(profile.source || profile.theme || profile.context) && (
        <div className="pt-4 border-t border-sand-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            {profile.source && (
              <div>
                <span className="text-charcoal-500 block font-sans">Scriptural Source</span>
                <span className="font-semibold text-charcoal-900 font-serif">
                  {profile.source} {profile.sourceReference ? `(${profile.sourceReference})` : ''}
                </span>
              </div>
            )}

            {profile.theme && (
              <div>
                <span className="text-charcoal-500 block font-sans">Vedic Theme</span>
                <span className="font-semibold text-charcoal-900 font-serif">
                  {profile.theme}
                </span>
              </div>
            )}
          </div>

          {profile.context && (
            <div className="text-right max-w-md">
              <span className="text-charcoal-500 block font-sans">Contextual Narrative</span>
              <span className="text-charcoal-700 italic block truncate">
                {profile.context}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

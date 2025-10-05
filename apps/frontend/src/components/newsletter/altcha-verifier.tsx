'use client';
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

// Importing altcha package will introduce a new element <altcha-widget>
import 'altcha';
import { config } from '@/lib/env';
import { isNil } from 'ramda';
import 'altcha/altcha.css';

interface AltchaProps extends Omit<AltchaWidget, 'challengeurl'> {
  onStateChange?: (ev: Event | CustomEvent) => void;
}
export type AltchaWidgetRef = AltchaWidget & AltchaWidgetMethods;
export type AltchaVerifierRef = {
  value: string | null;
  widget: AltchaWidgetRef | null;
};

const AltchaVerifier = forwardRef<AltchaVerifierRef, AltchaProps>(
  ({ onStateChange, ...props }, ref) => {
    const widgetRef = useRef<AltchaWidgetRef & HTMLElement>(null);
    const [value, setValue] = useState<string | null>(null);
    const [altchaVerifying, setAltchaVerifying] = useState(false);
    const [altchaVisible, setAltchaVisible] = useState(
      props.auto !== 'off' || isNil(props.auto),
    );

    useImperativeHandle(ref, () => {
      return {
        get value() {
          return value;
        },
        get widget() {
          return widgetRef.current;
        },
      };
    }, [value]);

    useEffect(() => {
      const handleStateChange = (ev: Event | CustomEvent) => {
        if ('detail' in ev) {
          setAltchaVerifying(ev.detail.state === 'verifying');

          if (ev.detail.state === 'code') {
            // If a code challenge is requested, show the widget
            setAltchaVisible(true);
          }

          if (ev.detail.state === 'unverified') {
            // Verification failed, show the widget or alert the user
            setAltchaVisible(true);
          }
          setValue(ev.detail.payload || null);
          onStateChange?.(ev);
        }
      };

      const { current } = widgetRef;

      if (current) {
        current.addEventListener('statechange', handleStateChange);
        return () =>
          current.removeEventListener('statechange', handleStateChange);
      }
    }, [onStateChange]);

    const challengeurl = `${config.BACKEND_URL}/altcha/challenge`;

    /* Configure your `challengeurl` and remove the `test` attribute, see docs: https://altcha.org/docs/v2/widget-integration/  */
    return (
      <altcha-widget
        ref={widgetRef}
        challengeurl={challengeurl}
        style={{
          '--altcha-max-width': '100%',
          display: altchaVisible ? 'block' : 'none',
        }}
        hidelogo
        hidefooter
        {...props}
      />
    );
  },
);

export default AltchaVerifier;

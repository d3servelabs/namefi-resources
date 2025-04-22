import { Fragment } from 'react';

export function MultipleLinesArrayErrorMessage({ lines }: { lines: string[] }) {
  return (
    <div className="text-red-500 text-sm mb-4">
      {lines.map((e) => (
        <Fragment key={e}>
          <span>{e}</span>
          <br />
        </Fragment>
      ))}
    </div>
  );
}

import { beforeEach, describe, expect, it, vi } from 'vitest';

const sharpToBufferMock = vi.fn();
const sharpPngMock = vi.fn(() => ({ toBuffer: sharpToBufferMock }));
const sharpResizeMock = vi.fn(() => ({ png: sharpPngMock }));
const sharpFactoryMock = vi.fn(() => ({ resize: sharpResizeMock }));

vi.mock('sharp', () => ({
  default: sharpFactoryMock,
}));

const dottedAddPinMock = vi.fn();
const dottedGetSvgMock = vi.fn();
const dottedMapCtorMock = vi.fn();

vi.mock('dotted-map', () => ({
  default: dottedMapCtorMock,
}));

const loggerWarnMock = vi.fn();
vi.mock('#lib/logger', () => ({
  logger: {
    warn: loggerWarnMock,
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    error: vi.fn(),
  },
}));

const { renderLoginLocationMap } = await import('./login-location-map');

describe('renderLoginLocationMap', () => {
  beforeEach(() => {
    // vitest resets mock implementations between tests (mockReset: true in
    // vitest.config.ts), so re-install them here. The two methods on the
    // returned instance are persistent vi.fn()s so call assertions still
    // work after reset.
    dottedMapCtorMock.mockImplementation(() => ({
      addPin: dottedAddPinMock,
      getSVG: dottedGetSvgMock,
    }));
    sharpFactoryMock.mockImplementation(() => ({
      resize: sharpResizeMock,
    }));
    sharpResizeMock.mockImplementation(() => ({ png: sharpPngMock }));
    sharpPngMock.mockImplementation(() => ({ toBuffer: sharpToBufferMock }));
    dottedGetSvgMock.mockReturnValue('<svg><circle/></svg>');
    sharpToBufferMock.mockResolvedValue({
      data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]),
      info: { width: 600, height: 302 },
    });
  });

  it('renders a PNG with the expected metadata for valid coordinates', async () => {
    const result = await renderLoginLocationMap({
      lat: 48.8566,
      lng: 2.3522,
    });

    expect(result).not.toBeNull();
    expect(result).toEqual({
      png: expect.any(Buffer),
      contentType: 'image/png',
      filename: 'login-location-map.png',
      width: 600,
      height: 302,
    });
    expect(result?.png.length).toBe(8);
    expect(dottedMapCtorMock).toHaveBeenCalledTimes(1);
    expect(dottedAddPinMock).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 48.8566, lng: 2.3522 }),
    );
    expect(sharpFactoryMock).toHaveBeenCalledTimes(1);
    expect(sharpResizeMock).toHaveBeenCalledWith({ width: 600 });
  });

  it.each([
    { name: 'NaN lat', lat: Number.NaN, lng: 0 },
    { name: 'NaN lng', lat: 0, lng: Number.NaN },
    { name: 'lat above 90', lat: 91, lng: 0 },
    { name: 'lat below -90', lat: -91, lng: 0 },
    { name: 'lng above 180', lat: 0, lng: 181 },
    { name: 'lng below -180', lat: 0, lng: -181 },
  ])('returns null for $name without invoking sharp', async ({ lat, lng }) => {
    const result = await renderLoginLocationMap({ lat, lng });
    expect(result).toBeNull();
    expect(sharpFactoryMock).not.toHaveBeenCalled();
    expect(dottedMapCtorMock).not.toHaveBeenCalled();
  });

  it('returns null and logs a coarsened-coords warning when rasterization throws', async () => {
    sharpToBufferMock.mockRejectedValueOnce(new Error('sharp boom'));

    const result = await renderLoginLocationMap({
      lat: 48.8566,
      lng: 2.3522,
    });

    expect(result).toBeNull();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    const [logPayload, logMessage] = loggerWarnMock.mock.calls[0];
    expect(logMessage).toContain('Failed to render login location map');
    expect(logPayload.error).toBeInstanceOf(Error);
    // Privacy: only coarsened (whole-degree) coords end up in logs.
    expect(logPayload).toMatchObject({
      latDeg: 49,
      lngDeg: 2,
    });
    expect(logPayload).not.toHaveProperty('lat');
    expect(logPayload).not.toHaveProperty('lng');
  });

  it('uses the alert pin color when isAlert is true', async () => {
    await renderLoginLocationMap({ lat: 0, lng: 0, isAlert: true });
    const pinArg = dottedAddPinMock.mock.calls.at(-1)?.[0];
    expect(pinArg.svgOptions.color).toBe('#f97316');
  });

  it('uses the OK pin color when isAlert is false', async () => {
    await renderLoginLocationMap({ lat: 0, lng: 0, isAlert: false });
    const pinArg = dottedAddPinMock.mock.calls.at(-1)?.[0];
    expect(pinArg.svgOptions.color).toBe('#4ade80');
  });
});

# Extended astronomical coverage

## Houses

Whole Sign and Equal remain supported. Placidus is calculated by solving the ecliptic right-ascension/semi-diurnal-arc equations for the intermediate cusps. Koch divides the MC diurnal arc and projects the corresponding sidereal times onto the Ascendant. Both use Astronomy Engine apparent sidereal time and true obliquity of date. This implementation was written locally; the application does not redistribute Swiss Ephemeris code or libraries.

Independent offline regression: `tests/fixtures/quadrant-houses.json`, 60 dates/locations (1900–2099, -65 to +65 degrees latitude), two systems, 1,440 cusps. Reference: Swiss Ephemeris 2.10.03 `houses_ex`; tolerance 0.012 degrees. Actual largest sampled difference: 0.000636 degrees. `tests/extended-astronomy.mjs` also checks actual chart Ascendants and house assignment.

Placidus/Koch are rejected at |latitude| >= 66.5 degrees. There is no silent fallback to a different system. Unknown birth time omits cusps and house placements. Whole Sign/Equal remain available at higher supported latitudes.

## Chiron

`lib/chiron.ts` embeds 2,308 heliocentric ICRF position/velocity knots from JPL Horizons (2060 Chiron, orbit JPL#171), spaced every 32 days. Generated 2026-10-12. The public civil-date coverage is 1900–2101; surrounding knots also support light-time iteration. Cubic Hermite interpolation uses both positions and velocities. The vector is corrected for light time and approximate annual aberration consistently with Astronomy Engine, then transformed to true ecliptic of date.

Reproduction API: https://ssd.jpl.nasa.gov/api/horizons.api

Parameters: COMMAND='2060;', EPHEM_TYPE='VECTORS', CENTER='500@10', REF_PLANE='FRAME', REF_SYSTEM='ICRF', START_TIME='1899-12-01', STOP_TIME='2102-02-01', STEP_SIZE='32d', VEC_TABLE='2', CSV_FORMAT='YES', OUT_UNITS='AU-D', OBJ_DATA='NO', MAKE_EPHEM='YES'. Parse JD TDB and x/y/z/vx/vy/vz from the $$SOE/$$EOE section. J2000 TT offset is JD-2451545. TDB/TT periodic differences are below the stated sampled tolerance.

Reference comparison: 25 JPL observer-table quantity-31 values, Earth center 500@399, UT input, apparent geocentric ecliptic-of-date longitude. Maximum sampled discrepancy: 0.000093 degrees. Both reference and state knots use the same JPL orbit; this validates interpolation and coordinate conversion, not an independent orbital solution. No claim of NASA certification or universal exactness is made.

Official API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html

## Transit timeline

A year of major aspect contacts is scanned at six-hour intervals, split at detected stations, and root-refined to one-minute numerical resolution. Repeated retrograde contacts are retained. Entry/exit windows use a one-degree orb; missing edges mean no boundary was found within 90 days.

The default overview covers Jupiter, Saturn, Uranus, Neptune, Pluto and Chiron. The web UI can select Sun, Moon, Mercury, Venus or Mars as well. Natal targets are Sun, Moon, Mercury, Venus, Mars, Chiron and Rising; unknown birth time excludes natal Moon and Rising. Ingresses, eclipses and node transits are explicitly excluded. This is an aspect-event timeline, not a prediction of life events and not a complete all-event ephemeris.

Independent reference: 73 contacts from Swiss Ephemeris/Moshier, Mercury and the five outer planets to natal personal bodies/Rising, same annual interval. Crossing counts match. Maximum observed timing difference: 138.53 minutes; slow motion near a station amplifies small position-model discrepancies. Therefore the UI must not confuse one-minute solver resolution with one-minute absolute astronomical accuracy.

Full web timelines require a valid season pass; dossier buyers receive the annual slow-planet calculation in their report data and a ten-contact summary distributed across the period in the ten-page PDF. Existing authentication, payment and ownership guards remain in force.

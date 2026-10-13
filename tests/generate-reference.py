"""Offline test-data generator, not an application dependency.
Requires pyswisseph 2.10.3.2 (Swiss Ephemeris 2.10.03) and Python zoneinfo.
Uses the independent Moshier backend, tropical apparent geocentric ecliptic-of-date.
Swiss runtime/ephemeris files are NOT distributed with the application.
Reference: https://www.astro.com/swisseph/swephprg.htm
"""
import json, datetime, zoneinfo
from pathlib import Path
import swisseph as swe
cases=[('historical-london','1900-05-15','09:45',51.5074,-.1278,'Europe/London',0),('historical-delhi','1920-08-11','11:20',28.6139,77.209,'Asia/Kolkata',0),('wartime-london','1942-07-01','12:30',51.5074,-.1278,'Europe/London',0),('new-york','1995-10-24','08:30',40.7128,-74.006,'America/New_York',0),('southern-hemisphere','2000-12-21','23:59',-33.8688,151.2093,'Australia/Sydney',0),('dst-earlier','2023-11-05','01:30',40.7128,-74.006,'America/New_York',0),('dst-later','2023-11-05','01:30',40.7128,-74.006,'America/New_York',1),('mumbai','2026-10-10','12:00',19.076,72.8777,'Asia/Kolkata',0),('future-los-angeles','2099-03-21','18:30',34.0522,-118.2437,'America/Los_Angeles',0),('high-latitude','2026-06-21','06:00',69.6492,18.9553,'Europe/Oslo',0)]
ids=[('Sun',swe.SUN),('Moon',swe.MOON),('Mercury',swe.MERCURY),('Venus',swe.VENUS),('Mars',swe.MARS),('Jupiter',swe.JUPITER),('Saturn',swe.SATURN),('Uranus',swe.URANUS),('Neptune',swe.NEPTUNE),('Pluto',swe.PLUTO),('True Node',swe.TRUE_NODE)]
fixtures=[]
for label,date,time,lat,lon,tz,fold in cases:
    d=datetime.datetime.fromisoformat(date+'T'+time).replace(tzinfo=zoneinfo.ZoneInfo(tz),fold=fold).astimezone(datetime.timezone.utc)
    jd=swe.julday(d.year,d.month,d.day,d.hour+d.minute/60+d.second/3600)
    planets={name:swe.calc_ut(jd,body,swe.FLG_MOSEPH)[0][0] for name,body in ids}
    w,a=swe.houses_ex(jd,lat,lon,b'W');e,_=swe.houses_ex(jd,lat,lon,b'E')
    fixtures.append(dict(id=label,date=date,time=time,location=dict(name=label,lat=lat,lon=lon,tz=tz),fold='later' if fold else 'earlier',utc=d.isoformat(timespec='milliseconds').replace('+00:00','Z'),planets=planets,asc=a[0],wholeSign=list(w),equal=list(e)))
Path('tests/fixtures/swiss-reference.json').write_text(json.dumps(dict(engine='Swiss Ephemeris '+swe.version,backend='Moshier',settings='Apparent geocentric tropical ecliptic of date; UTC -> UT Julian date; W/E houses',cases=fixtures),indent=2)+'\n')
print('Generated',len(fixtures),'independent reference charts')

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NASA_API_KEY = Deno.env.get('NASA_API_KEY');
    
    if (!NASA_API_KEY) {
      throw new Error('NASA_API_KEY is not configured');
    }

    console.log('Fetching NASA space weather data...');

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30); // últimos 30 dias

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Buscar dados de diferentes APIs da NASA DONKI
    const [flares, cme, geomagneticStorm, solarWind] = await Promise.allSettled([
      fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${formatDate(startDate)}&endDate=${formatDate(today)}&api_key=${NASA_API_KEY}`),
      fetch(`https://api.nasa.gov/DONKI/CME?startDate=${formatDate(startDate)}&endDate=${formatDate(today)}&api_key=${NASA_API_KEY}`),
      fetch(`https://api.nasa.gov/DONKI/GST?startDate=${formatDate(startDate)}&endDate=${formatDate(today)}&api_key=${NASA_API_KEY}`),
      fetch(`https://api.nasa.gov/DONKI/notifications?startDate=${formatDate(startDate)}&endDate=${formatDate(today)}&type=all&api_key=${NASA_API_KEY}`)
    ]);

    const data: any = {
      timestamp: new Date().toISOString(),
      period: {
        start: formatDate(startDate),
        end: formatDate(today)
      }
    };

    // Processar Solar Flares
    if (flares.status === 'fulfilled' && flares.value.ok) {
      const flareData = await flares.value.json();
      data.solarFlares = {
        count: flareData.length,
        recent: flareData.slice(0, 5).map((flare: any) => ({
          date: flare.beginTime,
          class: flare.classType,
          peakTime: flare.peakTime,
          sourceLocation: flare.sourceLocation
        }))
      };
      console.log(`Found ${flareData.length} solar flares`);
    }

    // Processar CME (Coronal Mass Ejections)
    if (cme.status === 'fulfilled' && cme.value.ok) {
      const cmeData = await cme.value.json();
      data.coronalMassEjections = {
        count: cmeData.length,
        recent: cmeData.slice(0, 5).map((event: any) => ({
          date: event.startTime,
          speed: event.speed,
          type: event.type,
          note: event.note
        }))
      };
      console.log(`Found ${cmeData.length} CME events`);
    }

    // Processar Geomagnetic Storms
    if (geomagneticStorm.status === 'fulfilled' && geomagneticStorm.value.ok) {
      const stormData = await geomagneticStorm.value.json();
      data.geomagneticStorms = {
        count: stormData.length,
        recent: stormData.slice(0, 5).map((storm: any) => ({
          date: storm.startTime,
          kpIndex: storm.allKpIndex?.[0]?.kpIndex,
          linkedEvents: storm.linkedEvents
        }))
      };
      console.log(`Found ${stormData.length} geomagnetic storms`);
    }

    // Processar Solar Wind Notifications
    if (solarWind.status === 'fulfilled' && solarWind.value.ok) {
      const notifications = await solarWind.value.json();
      data.notifications = {
        count: notifications.length,
        recent: notifications.slice(0, 10).map((notif: any) => ({
          date: notif.messageIssueTime,
          type: notif.messageType,
          body: notif.messageBody
        }))
      };
      console.log(`Found ${notifications.length} notifications`);
    }

    console.log('NASA space weather data fetched successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in nasa-space-weather:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

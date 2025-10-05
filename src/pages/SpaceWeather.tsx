import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sun, Zap, Radio, AlertTriangle, RefreshCw, TrendingUp, ExternalLink, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlossaryPopover } from "@/components/GlossaryPopover";

interface SpaceWeatherData {
  timestamp: string;
  period: {
    start: string;
    end: string;
  };
  solarFlares?: {
    count: number;
    recent: Array<{
      date: string;
      class: string;
      peakTime: string;
      sourceLocation?: string;
    }>;
  };
  coronalMassEjections?: {
    count: number;
    recent: Array<{
      date: string;
      speed?: number;
      type?: string;
      note?: string;
    }>;
  };
  geomagneticStorms?: {
    count: number;
    recent: Array<{
      date: string;
      kpIndex?: number;
      linkedEvents?: any[];
    }>;
  };
  notifications?: {
    count: number;
    recent: Array<{
      date: string;
      type: string;
      body: string;
    }>;
  };
}

interface TrendingTopic {
  title: string;
  description: string;
  category: "solar" | "magnetosphere" | "radiation" | "aurora" | "cosmic";
  relevance: number;
  nasaUrl: string;
}

const SpaceWeather = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<SpaceWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  const loadSpaceWeatherData = async () => {
    setLoading(true);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'nasa-space-weather'
      );

      if (functionError) throw functionError;

      setData(functionData);
    } catch (error: any) {
      console.error('Error loading space weather data:', error);
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load NASA space weather data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingTopics = async () => {
    if (!data) return;
    
    setLoadingTrending(true);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'analyze-trending-topics',
        {
          body: { spaceWeatherData: data }
        }
      );

      if (functionError) throw functionError;

      setTrendingTopics(functionData.topics || []);
      toast({
        title: "Topics updated!",
        description: "AI analyzed the latest NASA data",
      });
    } catch (error: any) {
      console.error('Error loading trending topics:', error);
      toast({
        title: "Error loading topics",
        description: error.message || "Failed to analyze data with AI",
        variant: "destructive",
      });
    } finally {
      setLoadingTrending(false);
    }
  };

  useEffect(() => {
    loadSpaceWeatherData();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'solar': return <Sun className="w-5 h-5" />;
      case 'magnetosphere': return <Radio className="w-5 h-5" />;
      case 'radiation': return <Zap className="w-5 h-5" />;
      case 'aurora': return <Sparkles className="w-5 h-5" />;
      case 'cosmic': return <TrendingUp className="w-5 h-5" />;
      default: return <Sun className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'solar': return 'text-primary';
      case 'magnetosphere': return 'text-accent';
      case 'radiation': return 'text-destructive';
      case 'aurora': return 'text-primary-glow';
      case 'cosmic': return 'text-purple-400';
      default: return 'text-primary';
    }
  };

  const getFlareClass = (classType: string) => {
    const firstChar = classType.charAt(0);
    if (firstChar === 'X') return { color: 'destructive', label: 'Extreme' };
    if (firstChar === 'M') return { color: 'default', label: 'Strong' };
    if (firstChar === 'C') return { color: 'secondary', label: 'Moderate' };
    return { color: 'secondary', label: 'Weak' };
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-foreground/80">Loading NASA Space Weather Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg">
      {/* Header */}
      <div className="border-b glass-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="gap-2 hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Space Weather Glossary
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time data from NASA DONKI (Space Weather Database)
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSpaceWeatherData}
              className="gap-2 glass-card border-primary/20 hover:bg-primary/10"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass-card grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="flares">Solar Flares</TabsTrigger>
            <TabsTrigger value="cme">CME</TabsTrigger>
            <TabsTrigger value="storms">Geomagnetic</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="glass-card border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sun className="w-5 h-5 text-primary" />
                    Solar Flares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {data?.solarFlares?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="w-5 h-5 text-accent" />
                    CME Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">
                    {data?.coronalMassEjections?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Radio className="w-5 h-5 text-primary-glow" />
                    Geomagnetic Storms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary-glow">
                    {data?.geomagneticStorms?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">
                    {data?.notifications?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Glossary Terms */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle>Interactive Space Weather Glossary</CardTitle>
                <CardDescription>
                  Click on highlighted terms to learn more about space weather phenomena
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none text-foreground/90">
                  <p>
                    <GlossaryPopover term="solar">Solar</GlossaryPopover> activity directly affects Earth's{" "}
                    <GlossaryPopover term="magnetosphere">magnetosphere</GlossaryPopover> and{" "}
                    <GlossaryPopover term="ionosphere">ionosphere</GlossaryPopover>. When the Sun releases
                    energy through solar flares or coronal mass ejections (CME), it can cause{" "}
                    <GlossaryPopover term="radiation">radiation</GlossaryPopover> storms that affect{" "}
                    <GlossaryPopover term="satellite">satellites</GlossaryPopover> and communications systems.
                  </p>
                  <p>
                    These events can also trigger beautiful{" "}
                    <GlossaryPopover term="aurora">auroras</GlossaryPopover> in polar regions. Additionally,{" "}
                    <GlossaryPopover term="cosmic">cosmic</GlossaryPopover> rays from deep space continuously
                    interact with Earth's <GlossaryPopover term="atmosphere">atmosphere</GlossaryPopover>,
                    creating a complex space weather environment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trending Topics Tab */}
          <TabsContent value="trending">
            <Card className="glass-card border-primary/20 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Trending Space Weather Topics
                    </CardTitle>
                    <CardDescription>
                      AI analysis of the latest NASA DONKI data
                    </CardDescription>
                  </div>
                  <Button
                    onClick={loadTrendingTopics}
                    disabled={loadingTrending}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {loadingTrending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Topics with AI
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {trendingTopics.length === 0 ? (
              <Card className="glass-card border-primary/20">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Sparkles className="w-16 h-16 mx-auto text-primary/50" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Discover Trending Topics</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Click "Generate Topics with AI" to discover the most relevant subjects
                        about space weather based on the latest NASA data
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trendingTopics
                  .sort((a, b) => b.relevance - a.relevance)
                  .map((topic, index) => (
                    <Card 
                      key={index} 
                      className="glass-card border-primary/20 hover:border-primary/40 transition-all hover:scale-105 cursor-pointer group"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className={`p-2 rounded-lg bg-background/50 ${getCategoryColor(topic.category)}`}>
                            {getCategoryIcon(topic.category)}
                          </div>
                          <Badge 
                            variant="outline" 
                            className="border-primary/30 bg-gradient-primary text-white"
                          >
                            {topic.relevance}% relevant
                          </Badge>
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {topic.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {topic.description}
                        </p>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <Badge variant="secondary" className="capitalize">
                            {topic.category}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(topic.nasaUrl, '_blank')}
                            className="gap-2 hover:text-primary"
                          >
                            NASA
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Additional NASA Resources */}
            {trendingTopics.length > 0 && (
              <Card className="glass-card border-primary/20 mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Additional Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => window.open('https://www.spaceweather.com/', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      SpaceWeather.com
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => window.open('https://www.swpc.noaa.gov/', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      NOAA Space Weather
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => window.open('https://science.nasa.gov/heliophysics/', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      NASA Heliophysics
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => window.open('https://www.space.com/news/space-weather', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Space.com News
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Solar Flares Tab */}
          <TabsContent value="flares">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-primary" />
                  Recent Solar Flares
                </CardTitle>
                <CardDescription>
                  Solar flares are intense bursts of radiation from the Sun's surface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {data?.solarFlares?.recent && data.solarFlares.recent.length > 0 ? (
                    <div className="space-y-3">
                      {data.solarFlares.recent.map((flare, index) => {
                        const flareInfo = getFlareClass(flare.class);
                        return (
                          <Card key={index} className="glass-card hover:bg-primary/5 transition-colors">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={flareInfo.color as any} className="font-mono">
                                      {flare.class}
                                    </Badge>
                                    <Badge variant="outline">{flareInfo.label}</Badge>
                                  </div>
                                  <div className="text-sm space-y-1">
                                    <p className="text-muted-foreground">
                                      <span className="font-semibold text-foreground">Begin:</span>{" "}
                                      {new Date(flare.date).toLocaleString()}
                                    </p>
                                    <p className="text-muted-foreground">
                                      <span className="font-semibold text-foreground">Peak:</span>{" "}
                                      {new Date(flare.peakTime).toLocaleString()}
                                    </p>
                                    {flare.sourceLocation && (
                                      <p className="text-muted-foreground">
                                        <span className="font-semibold text-foreground">Location:</span>{" "}
                                        {flare.sourceLocation}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No solar flares recorded in the last 30 days
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CME Tab */}
          <TabsContent value="cme">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Coronal Mass Ejections (CME)
                </CardTitle>
                <CardDescription>
                  Large expulsions of plasma and magnetic field from the Sun's corona
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {data?.coronalMassEjections?.recent && data.coronalMassEjections.recent.length > 0 ? (
                    <div className="space-y-3">
                      {data.coronalMassEjections.recent.map((cme, index) => (
                        <Card key={index} className="glass-card hover:bg-accent/5 transition-colors">
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-gradient-primary">
                                  {cme.speed ? `${cme.speed} km/s` : 'Speed N/A'}
                                </Badge>
                                {cme.type && (
                                  <Badge variant="outline">{cme.type}</Badge>
                                )}
                              </div>
                              <div className="text-sm space-y-1">
                                <p className="text-muted-foreground">
                                  <span className="font-semibold text-foreground">Start:</span>{" "}
                                  {new Date(cme.date).toLocaleString()}
                                </p>
                                {cme.note && (
                                  <p className="text-muted-foreground text-xs mt-2">
                                    {cme.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No CME events recorded in the last 30 days
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geomagnetic Storms Tab */}
          <TabsContent value="storms">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-primary-glow" />
                  Geomagnetic Storms
                </CardTitle>
                <CardDescription>
                  Disturbances in Earth's magnetosphere caused by solar wind
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {data?.geomagneticStorms?.recent && data.geomagneticStorms.recent.length > 0 ? (
                    <div className="space-y-3">
                      {data.geomagneticStorms.recent.map((storm, index) => (
                        <Card key={index} className="glass-card hover:bg-primary-glow/5 transition-colors">
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={storm.kpIndex && storm.kpIndex >= 5 ? "destructive" : "default"}>
                                  Kp Index: {storm.kpIndex || 'N/A'}
                                </Badge>
                                {storm.kpIndex && storm.kpIndex >= 5 && (
                                  <Badge variant="outline" className="border-destructive text-destructive">
                                    Strong Storm
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">Start:</span>{" "}
                                {new Date(storm.date).toLocaleString()}
                              </p>
                              {storm.linkedEvents && storm.linkedEvents.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Linked events: {storm.linkedEvents.length}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No geomagnetic storms recorded in the last 30 days
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SpaceWeather;

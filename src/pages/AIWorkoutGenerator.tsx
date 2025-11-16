/**
 * AI Workout Generator Page
 * Full page for AI workout generation with preferences management
 */

import { useState } from 'react';
import { MainNav } from '@/components/layout/MainNav';
import { AIWorkoutGenerator } from '@/components/ai/AIWorkoutGenerator';
import { AIPreferencesForm } from '@/components/ai/AIPreferencesForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, History, Settings, Clock, Dumbbell, ChevronRight } from 'lucide-react';
import { useAIGeneratedWorkouts, useAIPreferences } from '@/hooks/useAIWorkouts';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function AIWorkoutGeneratorPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generate');
  const { data: recentWorkouts, isLoading: loadingWorkouts } = useAIGeneratedWorkouts(10);
  const { data: preferences } = useAIPreferences();

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-purple-600" />
                AI Workout Generator
              </h1>
              <p className="text-lg text-gray-600">
                Create personalized workouts powered by Claude AI
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">AI Model</div>
                    <div className="font-semibold">Claude 3.5 Sonnet</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Dumbbell className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Workouts Generated</div>
                    <div className="font-semibold">{recentWorkouts?.length || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Settings className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Preferences</div>
                    <div className="font-semibold">
                      {preferences ? 'Configured' : 'Not Set'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-2">How It Works</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span>Tell us about your fitness level and goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span>Select available equipment and workout duration</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span>AI creates a personalized workout with proper form cues and safety notes</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span>Workout is automatically saved to your library</span>
                </li>
              </ul>
            </div>

            <AIWorkoutGenerator />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recently Generated Workouts</CardTitle>
                <CardDescription>
                  Your AI-generated workout history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingWorkouts ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : recentWorkouts && recentWorkouts.length > 0 ? (
                  <div className="space-y-3">
                    {recentWorkouts.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/workouts/${item.workout_id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{item.workout?.title || 'Untitled Workout'}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(item.generation_timestamp), 'MMM d, yyyy')}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {item.ai_model_used}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No AI-generated workouts yet</p>
                    <Button onClick={() => setActiveTab('generate')}>
                      Generate Your First Workout
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <AIPreferencesForm />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

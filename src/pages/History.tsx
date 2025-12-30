import { useWorkoutStore } from '@/store/workoutStore';
import { Card, CardContent } from '@/components/ui/card';
import { Dumbbell, Timer, Calendar, Flame, Trophy } from 'lucide-react';

export const HistoryPage = () => {
  const { sessions } = useWorkoutStore();

  const groupedSessions = sessions.reduce((acc, session) => {
    const month = new Date(session.date).toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
    if (!acc[month]) acc[month] = [];
    acc[month].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl font-display font-bold">Histórico</h1>
        <p className="text-muted-foreground text-sm">
          {sessions.length} treinos registrados
        </p>
      </div>

      {Object.entries(groupedSessions).map(([month, monthSessions]) => (
        <div key={month} className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <h2 className="text-sm font-semibold capitalize">{month}</h2>
            <span className="text-xs text-muted-foreground">
              ({monthSessions.length} treinos)
            </span>
          </div>

          <div className="space-y-2">
            {monthSessions.map((session, index) => (
              <Card 
                key={session.id}
                className="overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        session.dayId === 'ter' || session.dayId === 'qui' 
                          ? 'bg-neon-orange/10' 
                          : 'bg-primary/10'
                      }`}>
                        {session.dayId === 'ter' || session.dayId === 'qui' ? (
                          <Flame className="text-neon-orange" size={24} />
                        ) : (
                          <Dumbbell className="text-primary" size={24} />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{session.dayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1 justify-end">
                        <Timer size={14} className="text-muted-foreground" />
                        <span className="text-sm font-medium">{session.duration}min</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        {session.exercisesCompleted === session.totalExercises ? (
                          <Trophy size={14} className="text-primary" />
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {session.exercisesCompleted}/{session.totalExercises}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        session.exercisesCompleted === session.totalExercises 
                          ? 'bg-gradient-primary' 
                          : 'bg-primary/60'
                      }`}
                      style={{ 
                        width: `${(session.exercisesCompleted / session.totalExercises) * 100}%` 
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {sessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Dumbbell size={40} className="mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Nenhum treino registrado ainda.<br />
              Comece seu primeiro treino!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

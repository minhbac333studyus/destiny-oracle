import { CardStage } from '../../shared/models/card-stage.model';

export interface AspectYearSummary {
  aspectKey:      string;
  aspectLabel:    string;
  startStage:     CardStage;
  endStage:       CardStage;
  totalCheckIns:  number;
  goalsCompleted: number;
  keyInsight:     string;
}

export interface AnnualReflection {
  year:             number;
  generatedAt:      Date;
  narrativeHtml:    string;
  aspectSummaries:  AspectYearSummary[];
  overallTheme:     string;
  nextYearIntention: string;
}

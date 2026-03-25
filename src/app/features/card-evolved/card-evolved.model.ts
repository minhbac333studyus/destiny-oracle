import { CardStage } from '../../shared/models/card-stage.model';

export interface StageTransition {
  cardId:      string;
  fromStage:   CardStage;
  toStage:     CardStage;
  evolvedAt:   Date;
  newCardTitle: string;
}

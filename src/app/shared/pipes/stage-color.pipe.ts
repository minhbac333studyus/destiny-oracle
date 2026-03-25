import { Pipe, PipeTransform } from '@angular/core';
import { CardStage, STAGE_COLORS } from '../models/card-stage.model';

@Pipe({ name: 'stageColor', standalone: true })
export class StageColorPipe implements PipeTransform {
  transform(stage: CardStage): string {
    return STAGE_COLORS[stage] ?? '#4a5568';
  }
}

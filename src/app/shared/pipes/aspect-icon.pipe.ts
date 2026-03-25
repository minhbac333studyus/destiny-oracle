import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'aspectIcon', standalone: true })
export class AspectIconPipe implements PipeTransform {
  transform(aspectKey: string): string {
    // Aspects are now user-defined — return generic oracle icon
    return '🔮';
  }
}

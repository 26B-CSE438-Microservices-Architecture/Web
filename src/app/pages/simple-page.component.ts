import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-simple-page',
  template: `
    <section class="page-surface">
      <div class="page-header">
        <h1 class="page-title">{{ title() }}</h1>
        <p class="page-subtitle">{{ subtitle() }}</p>
      </div>
      <div class="placeholder-body">
        <p>Content for this section will be available soon.</p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimplePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, {
    initialValue: {
      title: 'Page',
      subtitle: 'Details will show here soon.'
    }
  });

  readonly title = computed(() => this.data().title as string);
  readonly subtitle = computed(() => this.data().subtitle as string);
}

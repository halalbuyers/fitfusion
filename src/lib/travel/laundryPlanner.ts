export function planLaundry(days: number) {
  if (days <= 5) {
    return {
      needed: false,
      schedule: [] as number[],
      reuseSchedule: ['Rewear bottoms 2-3 times', 'Reuse jackets and accessories throughout the trip'],
      rotationPlan: 'Pack enough tops and undergarments for the full trip; repeat bottoms and shoes.',
      advice: 'No laundry needed if you pack compactly.'
    }
  }
  const schedule = days <= 9
    ? [Math.ceil(days / 2)]
    : Array.from(new Set([5, 10, 15, 21, 28, 35, 42, 49, 56].filter((day) => day < days)))
  return {
    needed: true,
    schedule,
    reuseSchedule: [
      'Tops: refresh after each wear unless layered briefly',
      'Bottoms: repeat every 2-3 wears',
      'Shoes: rotate primary walking pair with one backup',
      'Outer layers: reuse across the whole trip'
    ],
    rotationPlan: `Plan laundry around day ${schedule.join(', day ')}. Rewear bottoms and outer layers, refresh tops and undergarments.`,
    advice: `Plan laundry around day ${schedule.join(', day ')}. Rewear bottoms and outer layers, refresh tops and undergarments.`
  }
}

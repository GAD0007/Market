import { Bike, MapPin } from 'lucide-react';
import {
  ABUJA_DISTRICTS,
  AbujaDistrict,
  BIKE_FLEET,
  formatNaira,
} from '../data/marketData';

interface CoverageAndFeesProps {
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  onOpenBag: () => void;
}

export function CoverageAndFees({
  selectedDistrictId,
  onSelectDistrict,
  onOpenBag,
}: CoverageAndFeesProps) {
  const activeDistrict: AbujaDistrict =
    ABUJA_DISTRICTS.find((d) => d.id === selectedDistrictId) || ABUJA_DISTRICTS[0];

  return (
    <>
      <section id="coverage" className="border-b border-[#E7E5E4] bg-[#FAFAF8]">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs font-medium text-[#52525B]">
                Abuja FCT Coverage <span aria-hidden="true">·</span> Dispatched from Apo Office
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#14221B] sm:text-3xl">
                Transparent location-based service charge
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#52525B]">
                Select your Abuja neighborhood below to preview your exact service charge (₦2,500 –
                ₦12,500) covering market sourcing and bike delivery from our Apo hub.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {ABUJA_DISTRICTS.map((district) => {
                  const isSelected = district.id === activeDistrict.id;
                  return (
                    <button
                      key={district.id}
                      type="button"
                      onClick={() => onSelectDistrict(district.id)}
                      aria-pressed={isSelected}
                      className={`relative flex min-h-[82px] flex-col items-start justify-between overflow-hidden rounded-xl border-2 p-3.5 text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C1917] ${
                        isSelected
                          ? 'border-[#1C1917] bg-[#FFAA0D] shadow-[0_8px_20px_-14px_rgba(28,25,23,0.75)] ring-2 ring-[#FFAA0D]/35'
                          : 'border-[#F1EADF] bg-white hover:-translate-y-0.5 hover:border-[#FFAA0D] hover:bg-[#FFF9EA] hover:shadow-sm'
                      }`}
                    >
                      <span className="flex w-full items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[#14221B]">{district.name}</span>
                        {isSelected && (
                          <span className="rounded-full bg-[#1C1917] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                            Selected
                          </span>
                        )}
                      </span>
                      <span
                        className={`mt-2 font-mono text-xs font-semibold tabular-nums ${
                          isSelected ? 'text-[#1C1917]' : 'text-[#52525B]'
                        }`}
                      >
                        {formatNaira(district.serviceChargeNgn)} · {district.distanceFromApoKm} km
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-xl border-2 border-[#FFAA0D] bg-white p-5 shadow-[0_14px_32px_-26px_rgba(180,83,9,0.55)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#B45309]">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF3D6]">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </span>
                      <span>Selected Delivery Location</span>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold text-[#14221B]">
                      {activeDistrict.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#52525B]">
                      {activeDistrict.distanceFromApoKm} km from Apo Office{' '}
                      <span aria-hidden="true">·</span> {activeDistrict.assignedBike}{' '}
                      <span aria-hidden="true">·</span> Est. {activeDistrict.etaWindow}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-[#71717A]">Service Charge</p>
                      <p className="font-mono text-xl font-semibold tabular-nums text-[#14221B]">
                        {formatNaira(activeDistrict.serviceChargeNgn)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenBag}
                      className="min-h-[40px] rounded-lg bg-[#1C1917] px-4 py-2 text-xs font-bold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-black"
                    >
                      Use in Bag
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-5">
              <div className="rounded-xl border border-[#F0D79E] bg-white p-6 shadow-[0_12px_30px_-26px_rgba(180,83,9,0.45)]">
                <h3 className="font-display text-lg font-semibold text-[#14221B]">
                  Service Charge by Location
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#52525B]">
                  Covers market sourcing, price negotiation, quality inspection, and doorstep bike
                  delivery based on your Abuja zone.
                </p>

                <div className="mt-4 divide-y divide-[#E7E5E4] border-y border-[#E7E5E4]">
                  <div className="flex items-center justify-between py-3 text-sm">
                    <span className="text-[#27272A]">Apo, Gudu &amp; Lokogoma (3–6 km)</span>
                    <span className="font-mono font-semibold tabular-nums text-[#14221B]">
                      ₦2,500 – ₦3,500
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 text-sm">
                    <span className="text-[#27272A]">Central Abuja: Garki to Maitama (8–15 km)</span>
                    <span className="font-mono font-semibold tabular-nums text-[#14221B]">
                      ₦4,500 – ₦8,500
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 text-sm">
                    <span className="text-[#27272A]">Lugbe, Gwarinpa &amp; Kubwa (18–28 km)</span>
                    <span className="font-mono font-semibold tabular-nums text-[#14221B]">
                      ₦9,500 – ₦12,500
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#F0D79E] bg-white p-6 shadow-[0_12px_30px_-26px_rgba(180,83,9,0.45)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF3D6]">
                    <Bike className="h-4 w-4 text-[#B45309]" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-[#14221B]">
                    3-Bike Launch Fleet (Apo Hub)
                  </h3>
                </div>
                <div className="mt-4 space-y-4">
                  {BIKE_FLEET.map((bike) => (
                    <div
                      key={bike.bikeId}
                      className="border-t border-[#E7E5E4] pt-3 first:border-t-0 first:pt-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-[#14221B]">
                          {bike.bikeId} — {bike.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#52525B]">{bike.zones.join(' · ')}</p>
                      <p className="mt-0.5 text-xs text-[#71717A]">{bike.capacityNote}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

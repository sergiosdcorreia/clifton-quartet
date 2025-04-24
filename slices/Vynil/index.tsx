"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

// Register the Draggable plugin for GSAP
if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable);
}

// Constants
const SG_COLOR_OFF = "#4d4d4d";
const SG_COLOR_ON = "#FDFE6C";

// Types
type DraggableInstance = {
  kill: () => void;
  minY?: number;
  maxY?: number;
  y?: number;
  minRotation?: number;
  maxRotation?: number;
  rotation?: number;
  target: HTMLElement | SVGElement;
};

export type VynilProps = SliceComponentProps<Content.VynilSlice>;

const Vynil: React.FC<VynilProps> = ({ slice }) => {
  // State
  const [spinState, setSpinState] = useState<number>(0); // 0 = not spinning, 1 = spinning
  const [needleState, setNeedleState] = useState<number>(0); // 0 = off, 1 = on record, 2 = manual handling
  const [volume, setVolume] = useState<number>(40);
  const [needleDrag, setNeedleDrag] = useState<boolean>(false);
  const [recordScratch, setRecordScratch] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  const [scratchAudioElement, setScratchAudioElement] =
    useState<HTMLAudioElement | null>(null);

  // Constants
  const NEEDLE_SWINGDOW = 44 - 18; // 18 == outside edge of record, 44 == inside edge of record

  // Refs for SVG elements
  const containerRef = useRef<HTMLDivElement>(null);
  const recordRef = useRef<SVGGElement>(null);
  const vinylRef = useRef<SVGGElement>(null);
  const recordPlateLightRef = useRef<SVGGElement>(null);
  const startButtonRef = useRef<SVGGElement>(null);
  const startButtonLightRef = useRef<SVGCircleElement>(null);
  const volumeControlRef = useRef<SVGGElement>(null);
  const volumeKnobRef = useRef<SVGGElement>(null);
  const volumeKnobLightRef = useRef<SVGPathElement>(null);
  const volumeTrackRef = useRef<SVGGElement>(null);
  const volumeLightLevelRef = useRef<SVGPathElement>(null);
  const needleArpertureRef = useRef<SVGGElement>(null);
  const needleArmRef = useRef<SVGGElement>(null);
  const needleFolcrumRef = useRef<SVGCircleElement>(null);
  const needleHeadHandleRef = useRef<SVGGElement>(null);
  const needleHeadLightsRef = useRef<SVGPathElement[]>([]);

  // Animation refs
  const vinylTweenRef = useRef<gsap.core.Tween | null>(null);
  const volumeKnobTweenRef = useRef<gsap.core.Tween | null>(null);
  const volumeLightLevelTweenRef = useRef<gsap.core.Tween | null>(null);
  const needleArmDraggableRef = useRef<DraggableInstance | null>(null);
  const vinylDraggableRef = useRef<DraggableInstance | null>(null);
  const volumeKnobDraggableRef = useRef<DraggableInstance | null>(null);

  // Helper functions
  const setupNeedleArmDraggable = useCallback(() => {
    if (!needleArmRef.current) return;

    needleArmDraggableRef.current = Draggable.create(needleArmRef.current, {
      type: "rotation",
      throwProps: true,
      bounds: { minRotation: 0, maxRotation: 44 },
      onDragStart: function () {
        // Immediately set drag state to prevent auto-updates from the interval
        setNeedleDrag(true);

        // If music is playing, pause it immediately during drag
        if (spinState === 1 && needleState === 1 && audioElement) {
          audioElement.pause();
        }
      },
      onDrag: function (this: DraggableInstance) {
        // Update visual state of needle during drag
        const rotation = this.rotation || 0;
        const lights = [
          needleFolcrumRef.current,
          ...needleHeadLightsRef.current,
        ];

        if (rotation >= 18 && rotation <= 44) {
          gsap.set(lights, { fill: SG_COLOR_ON });
          if (needleState !== 1) setNeedleState(1);
        } else {
          gsap.set(lights, { fill: SG_COLOR_OFF });
          if (needleState !== 0) setNeedleState(0);
        }
      },
      onDragEnd: function (this: DraggableInstance) {
        const rotation = this.rotation || 0;

        if (rotation >= 18 && rotation <= 44 && audioElement) {
          // Position audio according to needle position
          const pos = (rotation - 18) / NEEDLE_SWINGDOW;
          audioElement.currentTime = audioElement.duration * pos;

          // Resume playback if we were playing before
          if (spinState === 1) {
            audioElement
              .play()
              .catch((err) => console.error("Error resuming playback:", err));
          }
        } else if (rotation < 18 && audioElement) {
          // Needle is off the record
          audioElement.pause();
        }

        // Add a small delay before re-enabling auto-updates
        // This prevents jittering when transitioning back to automatic mode
        setTimeout(() => {
          setNeedleDrag(false);
        }, 100);
      },
    })[0];
  }, [audioElement, needleState, spinState, NEEDLE_SWINGDOW]);

  const syncNeedleToAudioPosition = useCallback(() => {
    if (!audioElement || !needleArmRef.current) return;

    // Only update if we're playing and not dragging
    if (spinState === 1 && !needleDrag) {
      const currentTime = audioElement.currentTime;
      const duration = audioElement.duration || 1; // Avoid division by zero

      // Calculate position as percentage
      const positionPercent = (currentTime / duration) * 100;

      // Map to needle rotation (18 to 44 degrees)
      const needleRotation = 18 + ((44 - 18) * positionPercent) / 100;

      // Apply the rotation directly with GSAP
      gsap.set(needleArmRef.current, {
        rotation: needleRotation,
        transformOrigin: "22px 62px",
      });

      // Update needle state if needed
      if (needleRotation >= 18 && needleState !== 1) {
        setNeedleState(1);
        gsap.set([needleFolcrumRef.current, ...needleHeadLightsRef.current], {
          fill: SG_COLOR_ON,
        });
      }
    }
  }, [audioElement, needleArmRef, spinState, needleDrag, needleState]);

  const updateNeedleState = useCallback((tween: DraggableInstance): void => {
    const rotation = tween.target._gsap.rotation;
    const lights = [needleFolcrumRef.current, ...needleHeadLightsRef.current];

    if (rotation >= 18 && rotation <= 44) {
      gsap.to(lights, { duration: 0.3, fill: SG_COLOR_ON });
      setNeedleState(1);
    } else {
      gsap.to(lights, { duration: 0.3, fill: SG_COLOR_OFF });
      setNeedleState(0);
    }
  }, []);

  const moveNeedleTo = useCallback(
    (val: number, callback?: () => void): void => {
      if (val < 0) val = 0;
      if (val > 44) val = 44;

      gsap.to(needleArmRef.current, {
        rotation: val,
        transformOrigin: "22px 62px",
        duration: 0.8,
        ease: "power2.out",
        onComplete: callback,
      });

      // Update needle state if needed
      const newNeedleState = val >= 18 && val <= 44 ? 1 : 0;

      if (newNeedleState !== needleState) {
        setNeedleState(newNeedleState);
        gsap.to([needleFolcrumRef.current, ...needleHeadLightsRef.current], {
          duration: 0.3,
          fill: newNeedleState === 1 ? SG_COLOR_ON : SG_COLOR_OFF,
        });
      }
    },
    [needleState]
  );

  const setVolumeLevel = useCallback(
    (val: number): void => {
      if (val < 0) val = 0;
      if (val > 100) val = 100;

      setVolume(val);

      // Set the volume knob position
      if (volumeKnobTweenRef.current)
        volumeKnobTweenRef.current.progress(val / 100);
      if (volumeLightLevelTweenRef.current)
        volumeLightLevelTweenRef.current.progress(val / 100);

      // Set the volume on the audio player
      if (audioElement) audioElement.volume = val / 100;

      // Update volume knob light
      if (val > 0) {
        gsap.set(volumeKnobLightRef.current, { stroke: SG_COLOR_ON });
      } else {
        gsap.set(volumeKnobLightRef.current, { stroke: SG_COLOR_OFF });
      }
    },
    [audioElement]
  );

  const loadNeedle = useCallback(
    (andPlay: boolean = false): void => {
      moveNeedleTo(18, () => {
        if (andPlay && audioElement) {
          audioElement.currentTime = 0;
          audioElement.play().catch((error) => {
            console.error("Failed to play audio:", error);
          });
        }
      });
    },
    [audioElement, moveNeedleTo]
  );

  const hangUpNeedle = useCallback((): void => {
    moveNeedleTo(0);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  }, [audioElement, moveNeedleTo]);

  const toggleStartStop = useCallback((): void => {
    if (spinState) {
      // Currently spinning so stop it
      if (vinylTweenRef.current) {
        vinylTweenRef.current.kill();
        vinylTweenRef.current = null; // Clear the reference
      }

      gsap.set(startButtonLightRef.current, { stroke: SG_COLOR_OFF });
      gsap.to(recordPlateLightRef.current, { duration: 2, autoAlpha: 0 });

      // Stop the sound if necessary
      if (audioElement) {
        audioElement.pause();
        // Reset audio to beginning
        audioElement.currentTime = 0;
      }

      // Move the needle back to position 0 (off the record)
      hangUpNeedle();

      setSpinState(0);
    } else {
      // Currently stopped so start it
      setVolumeLevel(volume);

      // IMPORTANT: Kill any existing draggable transformations before starting animation
      // This is crucial to avoid conflicts
      if (vinylDraggableRef.current) {
        const currentRotation = gsap.getProperty(vinylRef.current, "rotation");
        // Set the starting position to current rotation to avoid jumps
        gsap.set(vinylRef.current, { rotation: currentRotation });
      }

      // Create a completely fresh animation
      vinylTweenRef.current = gsap.to(vinylRef.current, {
        rotation: "+=360",
        duration: 3,
        ease: "none",
        repeat: -1,
      });

      gsap.set(startButtonLightRef.current, { stroke: SG_COLOR_ON });
      gsap.to(recordPlateLightRef.current, {
        duration: 1.4,
        autoAlpha: 1,
        delay: 0.25,
      });

      // Always load the needle when starting, regardless of current state
      loadNeedle(true);

      setSpinState(1);
    }
  }, [
    spinState,
    vinylTweenRef,
    vinylDraggableRef,
    vinylRef,
    audioElement,
    setVolumeLevel,
    volume,
    loadNeedle,
    hangUpNeedle,
  ]);

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/violin.mp3");
      audio.loop = false;

      // Make sure audio is properly loaded
      audio.addEventListener("loadedmetadata", () => {
        console.log("Audio loaded, duration:", audio.duration);
      });

      // Handle any errors
      audio.addEventListener("error", (e) => {
        console.error("Audio error:", e);
      });

      setAudioElement(audio);

      const scratchAudio = new Audio("/record_scratch.mp3");
      scratchAudio.loop = true;
      setScratchAudioElement(scratchAudio);
    }

    // Cleanup
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
      if (scratchAudioElement) {
        scratchAudioElement.pause();
        scratchAudioElement.src = "";
      }
    };
  }, []);

  // Setup animations and draggables when component mounts
  useEffect(() => {
    if (!containerRef.current) return;

    // Initial setup for all elements
    gsap.set(startButtonLightRef.current, { fill: SG_COLOR_OFF });
    gsap.set(volumeKnobRef.current, {
      y: "+=" + (volumeTrackRef.current?.getBBox().height || 0) / 2,
    });
    gsap.set(volumeKnobLightRef.current, { stroke: SG_COLOR_OFF });
    gsap.set(volumeLightLevelRef.current, {
      scaleY: 0.0,
      transformOrigin: "50% 100%",
    });
    gsap.set(recordPlateLightRef.current, { autoAlpha: 0 });
    gsap.set(vinylRef.current, { transformOrigin: "50% 50%" });
    gsap.set(needleArmRef.current, { transformOrigin: "22px 62px" });

    // MODIFIED: Create the vinyl rotation animation as a direct tween instead of timeline
    // This approach makes it easier to control with play/pause
    vinylTweenRef.current = gsap.to(vinylRef.current, {
      rotation: "+=360",
      duration: 3,
      ease: "none",
      repeat: -1,
      paused: true,
    });

    volumeKnobTweenRef.current = gsap.fromTo(
      volumeKnobRef.current,
      { y: (volumeTrackRef.current?.getBBox().height || 0) / 2 },
      {
        y: (-1 * (volumeTrackRef.current?.getBBox().height || 0)) / 2,
        duration: 1,
        ease: "none",
        paused: true,
      }
    );

    volumeLightLevelTweenRef.current = gsap.fromTo(
      volumeLightLevelRef.current,
      { scaleY: 0.0, transformOrigin: "50% 100%" },
      {
        scaleY: 1,
        duration: 1,
        paused: true,
        transformOrigin: "50% 100%",
        ease: "none",
      }
    );

    // Setup Volume Knob Draggable
    if (volumeKnobRef.current && volumeTrackRef.current) {
      volumeKnobDraggableRef.current = Draggable.create(volumeKnobRef.current, {
        type: "y",
        bounds: {
          minY: (volumeTrackRef.current.getBBox().height || 0) / 2,
          maxY: (-1 * (volumeTrackRef.current.getBBox().height || 0)) / 2,
        },
        onDragEnd: function (this: DraggableInstance) {
          if (
            this.minY !== undefined &&
            this.maxY !== undefined &&
            this.y !== undefined
          ) {
            const range = this.minY - this.maxY;
            const yval = this.y - this.maxY;
            const perc = (yval * 100) / range;
            setVolumeLevel(perc);
          }
        },
      })[0];
    }

    // Setup Needle Arm Draggable
    if (needleArmRef.current) {
      needleArmDraggableRef.current = Draggable.create(needleArmRef.current, {
        type: "rotation",
        throwProps: true,
        bounds: { minRotation: 0, maxRotation: 44 },
        onDrag: function (this: DraggableInstance) {
          updateNeedleState(this);
        },
        onDragStart: function () {
          setNeedleDrag(true);
          if (spinState === 1 && needleState === 1 && audioElement) {
            audioElement.pause();
          }
        },
        onDragEnd: function (this: DraggableInstance) {
          if (
            this.rotation !== undefined &&
            this.rotation >= 18 &&
            this.rotation <= 44 &&
            audioElement
          ) {
            const pos = (this.rotation - 18) / NEEDLE_SWINGDOW;
            audioElement.currentTime = audioElement.duration * pos;
            if (spinState === 1) {
              audioElement.play();
            }
          } else if (
            this.rotation !== undefined &&
            this.rotation < 18 &&
            audioElement
          ) {
            // Explicitly pause the audio when needle is below the record edge
            audioElement.pause();
          }
          setNeedleDrag(false);
        },
      })[0];
    }

    // Setup Vinyl Draggable for scratching
    if (vinylRef.current) {
      // The key is to tell Draggable not to apply transforms directly
      // and instead use our GSAP animation for rotation
      vinylDraggableRef.current = Draggable.create(vinylRef.current, {
        type: "rotation",
        inertia: false, // Disable inertia to avoid conflicts
        onDragStart: function () {
          setRecordScratch(true);
          // Kill any existing animation instead of pausing it
          if (vinylTweenRef.current) {
            vinylTweenRef.current.kill();
            vinylTweenRef.current = null; // Important: clear the reference
          }

          if (
            spinState === 1 &&
            needleState === 1 &&
            audioElement &&
            scratchAudioElement
          ) {
            audioElement.pause();
            scratchAudioElement.play();
          }
        },
        onDragEnd: function () {
          if (
            spinState === 1 &&
            needleState === 1 &&
            audioElement &&
            scratchAudioElement
          ) {
            // CREATE a new animation from scratch instead of resuming
            vinylTweenRef.current = gsap.to(vinylRef.current, {
              rotation: "+=360",
              duration: 3,
              ease: "none",
              repeat: -1,
            });

            scratchAudioElement.pause();
            scratchAudioElement.currentTime = 0;
            audioElement.play();
          }
          setRecordScratch(false);
        },
      })[0];
    }

    // Set initial volume
    setVolumeLevel(volume);
    setupNeedleArmDraggable();

    // Cleanup function
    return () => {
      if (needleArmDraggableRef.current) needleArmDraggableRef.current.kill();
      if (vinylDraggableRef.current) vinylDraggableRef.current.kill();
      if (volumeKnobDraggableRef.current) volumeKnobDraggableRef.current.kill();
      if (needleArmDraggableRef.current) needleArmDraggableRef.current.kill();

      if (vinylTweenRef.current) vinylTweenRef.current.kill();
      if (volumeKnobTweenRef.current) volumeKnobTweenRef.current.kill();
      if (volumeLightLevelTweenRef.current)
        volumeLightLevelTweenRef.current.kill();
    };
  }, [
    audioElement,
    scratchAudioElement,
    spinState,
    needleState,
    volume,
    NEEDLE_SWINGDOW,
    setVolumeLevel,
    updateNeedleState,
    setupNeedleArmDraggable,
  ]);

  // Track audio progress and update needle position
  useEffect(() => {
    if (!audioElement) return;

    // Only create the interval if we're not in drag mode
    let intervalId: NodeJS.Timeout | null = null;

    if (!needleDrag) {
      intervalId = setInterval(syncNeedleToAudioPosition, 50);
    }

    // Listen for audio end
    const handleAudioEnd = () => {
      hangUpNeedle();
      toggleStartStop();
    };

    audioElement.addEventListener("ended", handleAudioEnd);

    return () => {
      if (intervalId) clearInterval(intervalId);
      audioElement.removeEventListener("ended", handleAudioEnd);
    };
  }, [
    audioElement,
    syncNeedleToAudioPosition,
    hangUpNeedle,
    toggleStartStop,
    needleDrag,
  ]);

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <div ref={containerRef} id="container">
        <svg
          id="main"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 20 640 480"
        >
          <defs>
            <clipPath id="volume-mask">
              <path id="bar01" d="M559 429h18v5h-18z" />
              <path id="bar02" d="M559 419h18v5h-18z" />
              <path id="bar03" d="M559 409h18v5h-18z" />
              <path id="bar04" d="M559 399h18v5h-18z" />
              <path id="bar05" d="M559 389h18v5h-18z" />
              <path id="bar06" d="M559 379h18v5h-18z" />
              <path id="bar07" d="M559 369h18v5h-18z" />
              <path id="bar08" d="M559 359h18v5h-18z" />
              <path id="bar09" d="M559 349h18v5h-18z" />
              <path id="bar10" d="M559 339h18v5h-18z" />
              <path id="bar11" d="M559 329h18v5h-18z" />
            </clipPath>
          </defs>

          {/* Background */}
          <g id="background">
            <g id="bg">
              <radialGradient
                id="SVGID_1_"
                cx="429"
                cy="47.27"
                r="491.08"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#3D3C3C" />
                <stop offset=".206" stopColor="#323131" />
                <stop offset=".688" stopColor="#1C1D1D" />
                <stop offset="1" stopColor="#141515" />
              </radialGradient>
              <path fill="url(#SVGID_1_)" d="M34 28h570v427H34z" />
              <path
                fill="none"
                stroke="#070707"
                strokeWidth="2"
                d="M34 28h570v427H34z"
              />
            </g>
          </g>

          {/* Record */}
          <g id="Record" ref={recordRef}>
            <radialGradient
              id="recordplate_1_"
              cx="262.649"
              cy="215.289"
              r="175"
              gradientTransform="translate(-4.333 -.736) scale(1.017)"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".919" stopColor="#3D3C3C" />
              <stop offset=".935" stopColor="#323131" />
              <stop offset=".975" stopColor="#1C1D1D" />
              <stop offset="1" stopColor="#141515" />
            </radialGradient>
            <circle
              id="recordplate"
              cx="262.818"
              cy="218.245"
              r="178"
              fill="url(#recordplate_1_)"
              stroke="#000"
              strokeMiterlimit="10"
            />

            {/* Blue glow when record is playing */}
            <g opacity=".7" id="play-state-ring" ref={recordPlateLightRef}>
              <circle cx="262.818" cy="218.245" r="175" fill="#FDFE6C" />
            </g>

            {/* Main vinyl record */}
            <g id="vinyl" ref={vinylRef}>
              <circle
                id="record-edge"
                cx="262.818"
                cy="218.244"
                r="173"
                fill="#0A0A0A"
              />
              <g id="record-gradient">
                <linearGradient
                  id="SVGID_2_"
                  gradientUnits="userSpaceOnUse"
                  x1="346.61"
                  y1="363.38"
                  x2="179.023"
                  y2="73.11"
                >
                  <stop offset=".103" stopColor="#262626" />
                  <stop offset=".345" stopColor="#434343" />
                  <stop offset=".496" stopColor="#505050" />
                  <stop offset=".641" stopColor="#3D3B3C" />
                  <stop offset=".787" stopColor="#252223" />
                  <stop offset="1" />
                </linearGradient>
                <circle
                  cx="262.817"
                  cy="218.245"
                  r="167.56"
                  fill="url(#SVGID_2_)"
                />
                <path
                  d="M262.817 387.904c-93.55 0-169.66-76.11-169.66-169.66s76.11-169.66 169.66-169.66S432.48 124.69 432.48 218.243c0 93.55-76.113 169.66-169.663 169.66zm0-335.118c-91.234 0-165.458 74.225-165.458 165.458 0 91.234 74.223 165.458 165.457 165.458 91.236 0 165.46-74.225 165.46-165.458S354.053 52.786 262.817 52.786z"
                  fill="#231F20"
                />
              </g>

              {/* Center rings and label */}
              <circle cx="262.818" cy="218.245" r="75.234" opacity=".5" />
              <circle
                id="center-label"
                cx="262.818"
                cy="218.245"
                r="60.93"
                fill="#FDFE6C"
              />

              {/* Record grooves */}
              <path
                id="groove3"
                d="M262.82 313.632c-52.598 0-95.39-42.79-95.39-95.39 0-52.595 42.792-95.386 95.39-95.386 52.596 0 95.385 42.79 95.385 95.387 0 52.598-42.79 95.39-95.386 95.39zm0-189.038c-51.64 0-93.65 42.01-93.65 93.65 0 51.64 42.01 93.65 93.65 93.65 51.637 0 93.647-42.01 93.647-93.65 0-51.64-42.01-93.65-93.648-93.65z"
                opacity=".6"
                fill="#231F20"
              />
              <path
                id="groove2"
                d="M262.818 339.77c-67.01 0-121.528-54.517-121.528-121.526 0-67.01 54.518-121.528 121.528-121.528s121.527 54.518 121.527 121.528S329.83 339.77 262.818 339.77zm0-241.272c-66.028 0-119.747 53.72-119.747 119.747S196.79 337.99 262.82 337.99s119.746-53.718 119.746-119.745c0-66.028-53.717-119.747-119.746-119.747z"
                opacity=".6"
                fill="#231F20"
              />
              <path
                id="groove1"
                d="M262.818 364.73c-80.772 0-146.486-65.714-146.486-146.484 0-80.772 65.714-146.485 146.486-146.485s146.487 65.714 146.487 146.486c0 80.77-65.715 146.483-146.487 146.483zm0-290.824c-79.59 0-144.34 64.75-144.34 144.34 0 79.586 64.75 144.336 144.34 144.336s144.342-64.75 144.342-144.337c0-79.588-64.752-144.34-144.342-144.34z"
                opacity=".6"
                fill="#231F20"
              />

              {/* Center hole */}
              <radialGradient
                id="anchor-hole_1_"
                cx="262.818"
                cy="218.244"
                r="5"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#666" />
                <stop offset=".151" stopColor="#555" />
                <stop offset=".513" stopColor="#323232" />
                <stop offset=".809" stopColor="#1C1D1D" />
                <stop offset="1" stopColor="#141515" />
              </radialGradient>
              <circle
                id="anchor-hole"
                cx="262.818"
                cy="218.244"
                r="5"
                fill="url(#anchor-hole_1_)"
              />
            </g>
          </g>

          {/* Start/Stop Button */}
          <g id="StartButton" ref={startButtonRef} onClick={toggleStartStop}>
            <linearGradient
              id="start-button_2_"
              gradientUnits="userSpaceOnUse"
              x1="98.431"
              y1="367.15"
              x2="98.48"
              y2="420.083"
            >
              <stop offset="0" stopColor="#3D3C3C" />
              <stop offset=".206" stopColor="#323131" />
              <stop offset=".688" stopColor="#1C1D1D" />
              <stop offset="1" stopColor="#141515" />
            </linearGradient>
            <circle
              id="start-button_1_"
              ref={startButtonLightRef}
              cx="98.461"
              cy="400.582"
              r="36.154"
              stroke="#0A0A0A"
              strokeWidth="2"
            />
            <g id="start-stop-text" opacity=".8" fill="#999">
              <path d="M83.893 403.62c.352.224.855.395 1.396.395.8 0 1.27-.423 1.27-1.035 0-.558-.325-.89-1.145-1.197-.99-.36-1.603-.882-1.603-1.73 0-.944.784-1.646 1.963-1.646.612 0 1.07.145 1.333.297l-.216.64c-.19-.117-.594-.288-1.143-.288-.83 0-1.145.495-1.145.91 0 .566.37.846 1.207 1.17 1.026.395 1.54.89 1.54 1.782 0 .937-.685 1.755-2.116 1.755-.585 0-1.225-.18-1.55-.396l.207-.658z" />
              <path d="M89.33 399.172v1.044h1.133v.604H89.33v2.35c0 .54.152.846.593.846.216 0 .342-.018.46-.054l.035.604c-.153.054-.396.107-.702.107-.37 0-.666-.126-.855-.333-.215-.243-.305-.63-.305-1.143v-2.377h-.675v-.604h.675v-.81l.774-.234z" />
              <path d="M94.415 403.53c0 .377.018.746.063 1.043h-.71l-.064-.55h-.027c-.243.343-.71.648-1.333.648-.882 0-1.333-.62-1.333-1.25 0-1.054.938-1.63 2.62-1.62v-.09c0-.352-.098-1.01-.99-1-.414 0-.836.117-1.143.324l-.18-.53c.36-.226.89-.38 1.44-.38 1.333 0 1.657.91 1.657 1.774v1.63zm-.766-1.18c-.865-.018-1.846.135-1.846.98 0 .523.342.757.738.757.576 0 .945-.36 1.07-.73.028-.09.037-.18.037-.25v-.757z" />
              <path d="M95.692 401.575c0-.513-.01-.954-.036-1.36h.693l.035.865h.027c.198-.585.684-.954 1.215-.954.08 0 .144.01.216.018v.748c-.08-.02-.162-.02-.27-.02-.56 0-.955.415-1.063 1.01-.018.107-.027.243-.027.37v2.32h-.792v-2.997z" />
              <path d="M99.805 399.172v1.044h1.134v.604h-1.135v2.35c0 .54.153.846.594.846.215 0 .34-.018.458-.054l.036.604c-.153.054-.396.107-.702.107-.37 0-.666-.126-.855-.333-.216-.243-.306-.63-.306-1.143v-2.377h-.674v-.604h.675v-.81l.775-.234z" />
              <path d="M103.07 404.925l2.503-6.527h.62l-2.52 6.527h-.602z" />
              <path d="M108.66 403.62c.352.224.855.395 1.396.395.8 0 1.27-.423 1.27-1.035 0-.558-.324-.89-1.144-1.197-.99-.36-1.603-.882-1.603-1.73 0-.944.783-1.646 1.962-1.646.612 0 1.07.145 1.333.297l-.216.64c-.19-.117-.595-.288-1.144-.288-.83 0-1.144.495-1.144.91 0 .566.37.846 1.207 1.17 1.025.395 1.538.89 1.538 1.782 0 .937-.684 1.755-2.115 1.755-.585 0-1.225-.18-1.55-.396l.207-.658z" />
              <path d="M114.097 399.172v1.044h1.134v.604h-1.133v2.35c0 .54.153.846.594.846.217 0 .343-.018.46-.054l.036.604c-.153.054-.396.107-.702.107-.37 0-.666-.126-.855-.333-.217-.243-.307-.63-.307-1.143v-2.377h-.675v-.604h.675v-.81l.774-.234z" />
              <path d="M120.01 402.358c0 1.61-1.124 2.313-2.17 2.313-1.17 0-2.087-.863-2.087-2.24 0-1.45.963-2.305 2.16-2.305 1.25 0 2.098.91 2.098 2.233zm-3.447.045c0 .954.54 1.675 1.314 1.675.756 0 1.323-.71 1.323-1.692 0-.738-.37-1.666-1.305-1.666-.927 0-1.332.864-1.332 1.683z" />
              <path d="M121.008 401.64c0-.56-.018-1.01-.036-1.424h.702l.045.747h.017c.315-.53.837-.837 1.55-.837 1.06 0 1.853.892 1.853 2.206 0 1.566-.963 2.34-1.99 2.34-.576 0-1.08-.252-1.34-.684h-.02v2.367h-.782v-4.716zm.784 1.16c0 .117.01.225.036.324.144.55.62.927 1.188.927.837 0 1.324-.683 1.324-1.683 0-.864-.46-1.61-1.296-1.61-.54 0-1.053.377-1.197.972-.027.098-.054.215-.054.314v.756z" />
            </g>
            <circle
              id="on-light"
              cx="76.411"
              cy="401.582"
              r="4"
              opacity=".94"
              fill="#0A0A0A"
              stroke="#0A0A0A"
            />
          </g>

          {/* Needle Mechanism */}
          <g id="NeedleArperture" ref={needleArpertureRef}>
            <radialGradient
              id="SVGID_3_"
              cx="485.222"
              cy="106.585"
              r="47.093"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".94" stopColor="#3D3C3C" />
              <stop offset=".953" stopColor="#323131" />
              <stop offset=".981" stopColor="#1C1D1D" />
              <stop offset="1" stopColor="#141515" />
            </radialGradient>
            <circle
              cx="485.222"
              cy="106.585"
              r="47.081"
              fill="url(#SVGID_3_)"
            />
            <radialGradient
              id="SVGID_4_"
              cx="485.223"
              cy="106.585"
              r="44.149"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#3D3C3C" />
              <stop offset=".206" stopColor="#323131" />
              <stop offset=".688" stopColor="#1C1D1D" />
              <stop offset="1" stopColor="#141515" />
            </radialGradient>
            <circle
              cx="485.222"
              cy="106.585"
              r="44.138"
              fill="url(#SVGID_4_)"
            />

            {/* Needle Arm */}
            <g id="needle-arm" ref={needleArmRef}>
              <path
                d="M497.835 301.72c-1.345.003-2.702-.423-3.854-1.302-2.78-2.128-3.31-6.107-1.182-8.89 8.236-10.79 29.715-45.175 20.632-61.055-13.103-22.906-32.986-58.176-33.186-58.53-.535-.95-.816-2.02-.817-3.107l-.018-19.51c-.006-3.5 2.83-6.342 6.333-6.345s6.343 2.834 6.346 6.335l.015 17.848c3.885 6.882 20.76 36.785 32.33 57.015 14.905 26.058-17.79 70.116-21.565 75.056-1.247 1.63-3.13 2.486-5.035 2.487z"
                fill="#09090A"
              />
              <linearGradient
                id="SVGID_5_"
                gradientUnits="userSpaceOnUse"
                x1="479.094"
                y1="142.778"
                x2="492.417"
                y2="142.778"
              >
                <stop offset="0" />
                <stop offset=".463" stopColor="#292929" />
                <stop offset="1" stopColor="#555" />
              </linearGradient>
              <path
                fill="url(#SVGID_5_)"
                d="M492.417 152.566l-13.306.013-.016-19.59 13.305-.012z"
              />
              <circle
                id="needle-folcrum-light"
                ref={needleFolcrumRef}
                cx="485.423"
                cy="106.139"
                r="18.859"
                fill="#4D4D4D"
              />
              <circle cx="485.422" cy="106.138" r="14.957" fill="#242225" />
              <circle cx="485.423" cy="106.138" r="10.241" fill="#838182" />
              <path
                fill="#09090A"
                d="M492.35 78.434l5.82-4.07-.006-4.39L473.21 70l.004 4.227 5.794 4.22z"
              />
              <linearGradient
                id="SVGID_6_"
                gradientUnits="userSpaceOnUse"
                x1="473.185"
                y1="57.712"
                x2="498.167"
                y2="57.712"
              >
                <stop offset="0" />
                <stop offset=".463" stopColor="#292929" />
                <stop offset="1" stopColor="#555" />
              </linearGradient>
              <path
                fill="url(#SVGID_6_)"
                d="M498.167 71.274l-24.957.025-.024-27.15 24.956-.025z"
              />
              <path
                fill="#3C3A3F"
                d="M492.477 292.425l10.122 6.844-7.067 10.448-10.122-6.845z"
              />

              {/* Needle Head and Handle */}
              <g
                id="needle-head-handle"
                ref={needleHeadHandleRef}
                fill="#121114"
              >
                <path
                  id="needle-handle"
                  d="M510.53 337.854l-22.39-13.61 3.878-5.737 20.128 17.04z"
                />
                <path
                  id="needle-head"
                  d="M485.745 298.094l14.044 9.488-22.398 33.15-14.044-9.487z"
                />
              </g>

              {/* Needle Lights */}
              <path
                id="needle-neck-light"
                className="needle-head-lights"
                ref={(el) => {
                  needleHeadLightsRef.current =
                    needleHeadLightsRef.current || [];
                  if (el) needleHeadLightsRef.current.push(el);
                }}
                fill="#4D4D4D"
                d="M492.568 291.31l11.028 7.453-1.158 1.712-11.028-7.453z"
              />
              <path
                id="needle-light2"
                className="needle-head-lights"
                ref={(el) => {
                  needleHeadLightsRef.current =
                    needleHeadLightsRef.current || [];
                  if (el) needleHeadLightsRef.current.push(el);
                }}
                fill="#4D4D4D"
                d="M476.265 317.786l2.885 1.95-5.474 8.102-2.886-1.95z"
              />
              <path
                id="needle-light1"
                className="needle-head-lights"
                ref={(el) => {
                  needleHeadLightsRef.current =
                    needleHeadLightsRef.current || [];
                  if (el) needleHeadLightsRef.current.push(el);
                }}
                fill="#4D4D4D"
                d="M482.072 321.776l2.885 1.952-5.478 8.098-2.886-1.952z"
              />
            </g>
          </g>

          {/* Volume Control */}
          <g id="VolumeControl" ref={volumeControlRef}>
            <g id="volume-track" ref={volumeTrackRef}>
              <path
                fill="#0F0F0F"
                stroke="#0F0F0F"
                d="M532.5 329.5h5v105h-5z"
              />
              <path
                opacity=".5"
                fill="#09090A"
                stroke="#4D4D4D"
                d="M533.5 330v104M537 433.5h-3"
              />
            </g>
            <g id="volume-knob" ref={volumeKnobRef}>
              <linearGradient
                id="SVGID_7_"
                gradientUnits="userSpaceOnUse"
                x1="535.5"
                y1="373.5"
                x2="535.5"
                y2="391.017"
              >
                <stop offset="0" stopColor="#3D3C3C" />
                <stop offset=".206" stopColor="#323131" />
                <stop offset=".688" stopColor="#1C1D1D" />
                <stop offset="1" stopColor="#141515" />
              </linearGradient>
              <path
                d="M553.5 388.717c0 .984-.8 1.783-1.783 1.783h-32.434c-.984 0-1.783-.8-1.783-1.783v-14.434c0-.984.8-1.783 1.783-1.783h32.434c.984 0 1.783.8 1.783 1.783v14.434z"
                fill="url(#SVGID_7_)"
                stroke="#000"
              />
              <path
                fill="none"
                stroke="#000"
                strokeWidth="3"
                d="M517 382.5h36"
              />
              <path
                id="knob-light"
                ref={volumeKnobLightRef}
                fill="none"
                stroke="#FDFE6C"
                strokeWidth="2"
                d="M518 383h35"
              />
            </g>

            {/* Volume Light Bars */}
            <g id="volume-light-bars" fill="#0F0F0F">
              <path id="bar01_2_" d="M559 429h18v5h-18z" />
              <path id="bar02_2_" d="M559 419h18v5h-18z" />
              <path id="bar03_2_" d="M559 409h18v5h-18z" />
              <path id="bar04_2_" d="M559 399h18v5h-18z" />
              <path id="bar05_2_" d="M559 389h18v5h-18z" />
              <path id="bar06_2_" d="M559 379h18v5h-18z" />
              <path id="bar07_2_" d="M559 369h18v5h-18z" />
              <path id="bar08_2_" d="M559 359h18v5h-18z" />
              <path id="bar09_2_" d="M559 349h18v5h-18z" />
              <path id="bar10_2_" d="M559 339h18v5h-18z" />
              <path id="bar11_2_" d="M559 329h18v5h-18z" />
            </g>

            {/* Volume Light Level Indicator */}
            <g id="volume-light-level" clipPath="url(#volume-mask)">
              <path
                id="light-level"
                ref={volumeLightLevelRef}
                fill="#FDFE6C"
                d="M559 329h18v105h-18z"
              />
            </g>
          </g>
        </svg>
      </div>
    </section>
  );
};

export default Vynil;

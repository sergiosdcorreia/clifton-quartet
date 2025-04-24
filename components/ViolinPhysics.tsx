"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bodies,
  Engine,
  Mouse,
  MouseConstraint,
  Render,
  Runner,
  World,
} from "matter-js";

export type InstrumentConfig = {
  url: string;
  width: number;
  height: number;
  quantity?: number; // Add quantity property
  options?: Matter.IChamferableBodyDefinition;
};

type FooterPhysicsProps = {
  violinConfig?: InstrumentConfig;
  violinBowConfig?: InstrumentConfig;
  celloConfig?: InstrumentConfig;
  className?: string;
};

export function ViolinPhysics({
  violinConfig,
  violinBowConfig,
  celloConfig,
  className,
}: FooterPhysicsProps) {
  const scene = useRef<HTMLDivElement>(null);
  const engine = useRef(Engine.create());
  const [inView, setInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.matchMedia("(max-width: 768px)").matches);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const currentScene = scene.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (currentScene) observer.observe(currentScene);

    return () => {
      if (currentScene) observer.unobserve(currentScene);
    };
  }, []);

  useEffect(() => {
    if (!scene.current || !inView) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const cw = scene.current.clientWidth;
    const ch = scene.current.clientHeight;

    engine.current.gravity.y = 0.6;

    const render = Render.create({
      element: scene.current,
      engine: engine.current,
      options: {
        width: cw,
        height: ch,
        pixelRatio: window.devicePixelRatio,
        wireframes: false,
        background: "transparent",
      },
    });

    let boundaries = createBoundaries(cw, ch);
    World.add(engine.current.world, boundaries);

    const mouse = Mouse.create(render.canvas);
    // @ts-expect-error - matter-js has incorrect types
    mouse.element.removeEventListener("wheel", mouse.mousewheel);

    const mouseConstraint = MouseConstraint.create(engine.current, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    World.add(engine.current.world, mouseConstraint);

    window.addEventListener("resize", onResize);

    function onResize() {
      if (!scene.current) return;

      const cw = scene.current.clientWidth;
      const ch = scene.current.clientHeight;

      render.canvas.width = cw;
      render.canvas.height = ch;
      render.options.width = cw;
      render.options.height = ch;
      Render.setPixelRatio(render, window.devicePixelRatio);

      World.remove(engine.current.world, boundaries);
      boundaries = createBoundaries(cw, ch);
      World.add(engine.current.world, boundaries);
    }

    function createBoundaries(width: number, height: number) {
      return [
        Bodies.rectangle(width / 2, -10, width, 20, { isStatic: true }),
        Bodies.rectangle(-10, height / 2, 20, height, { isStatic: true }),
        Bodies.rectangle(width / 2, height + 10, width, 20, { isStatic: true }),
        Bodies.rectangle(width + 10, height / 2, 20, height, {
          isStatic: true,
        }),
      ];
    }

    const runner = Runner.create();
    Runner.run(runner, engine.current);
    Render.run(render);

    const currentEngine = engine.current;

    return () => {
      window.removeEventListener("resize", onResize);

      Render.stop(render);
      Runner.stop(runner);
      if (currentEngine) {
        World.clear(currentEngine.world, false);
        Engine.clear(currentEngine);
      }
      render.canvas.remove();
      render.textures = {};
    };
  }, [inView]);

  useEffect(() => {
    if (!scene.current || !inView) return;

    const world = engine.current.world;
    const cw = scene.current.clientWidth;
    const ch = scene.current.clientHeight;

    // Array to collect all objects for later cleanup
    const allObjects: Matter.Body[] = [];

    // Create the violin instances if config is provided
    if (violinConfig) {
      // Determine quantity based on device type
      const baseQuantity = violinConfig.quantity || 1;
      const actualQuantity = isMobile ? 1 : baseQuantity;

      for (let i = 0; i < actualQuantity; i++) {
        const x = Math.random() * (cw - 100) + 50;
        const y = Math.random() * (ch / 3) + 50;
        const rotation = ((Math.random() * 60 - 30) * Math.PI) / 180;

        // Default violin options if not provided
        const defaultOptions = {
          chamfer: { radius: 15 },
          angle: rotation,
          restitution: 0.5,
          friction: 0.1,
          density: 0.002, // Lower density to make it float better
        };

        const violinBody = Bodies.rectangle(
          x,
          y,
          violinConfig.width,
          violinConfig.height,
          {
            ...defaultOptions,
            ...violinConfig.options,
            render: {
              sprite: {
                texture: violinConfig.url,
                xScale: 1,
                yScale: 1,
              },
            },
          }
        );

        World.add(world, violinBody);
        allObjects.push(violinBody);
      }
    }

    // Create the violin bow instances if config is provided
    if (violinBowConfig) {
      // Determine quantity based on device type
      const baseQuantity = violinBowConfig.quantity || 1;
      const actualQuantity = isMobile ? 1 : baseQuantity;

      for (let i = 0; i < actualQuantity; i++) {
        const x = Math.random() * (cw - 100) + 50;
        const y = Math.random() * (ch / 3) + 50;
        const rotation = ((Math.random() * 90 - 45) * Math.PI) / 180;

        // Bow is longer and thinner
        const defaultOptions = {
          chamfer: { radius: 5 },
          angle: rotation,
          restitution: 0.3,
          friction: 0.05,
          density: 0.001, // Very light
        };

        const bowBody = Bodies.rectangle(
          x,
          y,
          violinBowConfig.width,
          violinBowConfig.height,
          {
            ...defaultOptions,
            ...violinBowConfig.options,
            render: {
              sprite: {
                texture: violinBowConfig.url,
                xScale: 1,
                yScale: 1,
              },
            },
          }
        );

        World.add(world, bowBody);
        allObjects.push(bowBody);
      }
    }

    // Create the cello instances if config is provided
    if (celloConfig) {
      // Determine quantity based on device type
      const baseQuantity = celloConfig.quantity || 1;
      const actualQuantity = isMobile ? 1 : baseQuantity;

      for (let i = 0; i < actualQuantity; i++) {
        const x = Math.random() * (cw - 150) + 75;
        const y = Math.random() * (ch / 3) + 50;
        const rotation = ((Math.random() * 40 - 20) * Math.PI) / 180;

        // Cello is larger and heavier
        const defaultOptions = {
          chamfer: { radius: 20 },
          angle: rotation,
          restitution: 0.4,
          friction: 0.15,
          density: 0.003, // Heavier than violin
        };

        const celloBody = Bodies.rectangle(
          x,
          y,
          celloConfig.width,
          celloConfig.height,
          {
            ...defaultOptions,
            ...celloConfig.options,
            render: {
              sprite: {
                texture: celloConfig.url,
                xScale: 1,
                yScale: 1,
              },
            },
          }
        );

        World.add(world, celloBody);
        allObjects.push(celloBody);
      }
    }

    return () => {
      World.remove(world, allObjects);
    };
  }, [violinConfig, violinBowConfig, celloConfig, inView, isMobile]);

  return <div ref={scene} className={className} />;
}

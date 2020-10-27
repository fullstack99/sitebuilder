declare namespace AviaryNS {
    interface Aviary {
        Feather: FeatherStatic
    }

    interface FeatherStatic {
        new (options: FeatherOptions): Feather;
    }

    interface Feather {
        launch(options: FeatherOptions): void;
        getImageDimensions(): { width: number, height: number };
        showWaitIndicator();
        hideWaitIndicator();
        save();
        close();
        getImageData(callback: (data: string) => void);
    }

    interface FeatherOptions {
        apiKey?: string,
        /** Either the image element to be edited or its ID. */
        disableWebGL?: boolean,
        image?: HTMLImageElement | string,
        theme?: 'dark' | 'light' | 'minimum',
        appendTo?: string,
        noCloseButton?: boolean,
        tools?: 'all' | FeatherTools[],
        url?: string,
        fileFormat?: 'png' | 'jpg',
        jpgQuality?: number,
        displayImageSize?: boolean,
        onLoad?: () => void,
        onReady?: () => void,
        onSaveButtonClicked?: (imageId: string) => boolean,
        onSave?: (imageId: string, newUrl: string) => boolean,
        onClose?: (isDirty: boolean) => void,
        onError?: (error: FeatherError) => void
    }

    type FeatherTools =
          'enhance'    // Autocorrect your photo with one of five basic enhancements.
        | 'effects'    // Choose from a variety of effects and filters for your photo.
        | 'frames'     // Choose from a variety of frames to apply around your photo.
        | 'overlays'   // Choose from a variety of overlays to apply over your photo.
        | 'stickers'   // Choose from a variety of stickers you can resize and place on your photo.
        | 'orientation'// Rotate and flip your photo in one tool.
        | 'crop'       // Crop a portion of your photo. Add presets via API. Fixed-pixel cropPresets perform a resize when applied.
        | 'resize'     // Resize the image using width and height number fields.
        | 'lighting'   // Adjust the lighting in your photo with this collection of adjustment toools.
        | 'color'      // Adjust the color in your photo with this collection of adjustment toools.
        | 'sharpness'  // Blur or sharpen the overall image in one tool.
        | 'focus'      // Adds a selective linear or radial focus to your photo.
        | 'vignette'   // Adds an adjustable vignette to your photo.
        | 'blemish'    // Remove skin blemishes with a brush.
        | 'whiten'     // Whiten teeth with a brush.
        | 'redeye'     // Remove redeye from your photo with a brush.
        | 'draw'       // Add doodle overlays with a brush.
        | 'colorsplash'// Use a smart brush to colorize parts of your photo which becomes grayscale otherwise.
        | 'text'       // Add custom, resizable text.
        | 'meme'       // Turn your photo into a meme with this tool that adds text to the top and bottom of your photo.

    interface FeatherError {
        code: number,
        message: string,
        args: any[]
    }
}

declare var Aviary: AviaryNS.Aviary;

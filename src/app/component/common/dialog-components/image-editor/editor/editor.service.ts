import { Maybe } from '@app-lib/maybe/maybe';

export class EditorService {
    public readonly _apiKey = '40974af6086e476796b5102b15f57090'; // 'b3595f27f1d645d98e6cb73207b25cfc';

    public _editor = Maybe.nothing<AviaryNS.Feather>();

    getEditor(theme: 'dark' | 'light' | 'minimum' = 'minimum'): Promise<AviaryNS.Feather> {
        return new Promise<AviaryNS.Feather>((resolve, reject) =>
            this._editor.ifElse(
                editor => resolve(editor),
                () => {
                    const editor = Maybe.just(new Aviary.Feather({
                        apiKey: this._apiKey,
                        // disableWebGL: true,
                        onLoad: () => {
                            this._editor = editor;
                            resolve(this._editor.value);
                        },
                        onError: reject,
                        theme
                    }));
                }));
    }
}

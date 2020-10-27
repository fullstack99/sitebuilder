export class AttentionInfo {
    constructor(
        public title: DispStr,
        public content: DispStr[],
        public button: boolean, // true: button
        public button_values: string[],       
        public feedback_code: string
    ) { }
    static empty(): AttentionInfo {
        return new AttentionInfo(
            {value: 'ATTENTION', font_size: '22px', color: 'red'},
            [],
            false,
            ['Proceed','Stop'],
            ''
        );
    }    
}

export interface DispStr {
    value: string;
    font_size: string;
    color: string;
}
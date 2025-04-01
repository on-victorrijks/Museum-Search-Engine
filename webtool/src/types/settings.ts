export interface Settings {
    model_name: string;
    method: 'classic' | 'power' | 'rocchio';
    rocchio_k: number;
    rocchio_scale: number;
    language: 'fr' | 'nl' | 'en';
}

export interface Model {
    model_name: string;
    model_id: string;
}

export interface ServerSettingsInfos {
    models: Model[];
    keywords: string[];
    colors: string[];
    luminosities: string[];
    methods: string[];
    languages: string[];
    min_rocchio_k: number;
    max_rocchio_k: number;
    min_rocchio_scale: number;
    max_rocchio_scale: number;
}
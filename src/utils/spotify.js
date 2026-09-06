import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// O Spotify praticamente parou de devolver prévia de 30s pra apps de
// terceiros (mudança deles, desde nov/2024) — a Web Search API pública e
// gratuita do iTunes ainda devolve, então usamos ela só pra achar o áudio
// da prévia (nome/artista/capa/link continuam vindo do Spotify).
const fetchItunesPreview = async (name, artist) => {
    try {
        const term = encodeURIComponent(`${name} ${artist}`);
        const resp = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`);
        if (!resp.ok) return null;
        const data = await resp.json();
        return data?.results?.[0]?.previewUrl || null;
    } catch {
        return null;
    }
};

// Busca faixas no catálogo público do Spotify (via Cloud Function — a chave
// do Spotify nunca fica no navegador), complementando cada uma com uma
// prévia de áudio do iTunes quando disponível. Retorna [] se a busca falhar.
export const searchSpotifyTracks = async (query) => {
    if (!query || !query.trim()) return [];
    try {
        const spotifySearch = httpsCallable(functions, 'spotifySearch');
        const { data } = await spotifySearch({ query: query.trim() });
        const tracks = data?.tracks || [];

        const withPreviews = await Promise.all(
            tracks.map(async (track) => ({
                ...track,
                previewUrl: track.previewUrl || await fetchItunesPreview(track.name, track.artist),
            }))
        );
        return withPreviews;
    } catch (error) {
        console.error('Erro na busca do Spotify:', error);
        return [];
    }
};

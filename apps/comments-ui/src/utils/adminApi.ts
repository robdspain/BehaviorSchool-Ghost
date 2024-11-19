export function setupAdminAPI({adminUrl}: {adminUrl: string}) {
    const frame = document.querySelector('iframe[data-frame="admin-auth"]') as HTMLIFrameElement;
    let uid = 1;
    const handlers: Record<string, (error: Error|undefined, result: any) => void> = {};
    const adminOrigin = new URL(adminUrl).origin;

    const firstCommentCreatedAt: null | string = null;

    window.addEventListener('message', function (event) {
        if (event.origin !== adminOrigin) {
            // Other message that is not intended for us
            return;
        }

        let data = null;
        try {
            data = JSON.parse(event.data);
        } catch (err) {
            return;
        }

        const handler = handlers[data.uid];

        if (!handler) {
            return;
        }

        delete handlers[data.uid];

        handler(data.error, data.result);
    });

    function callApi(action: string, args?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            function handler(error: Error|undefined, result: any) {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            }
            uid += 1;
            handlers[uid] = handler;
            frame.contentWindow!.postMessage(JSON.stringify({
                uid,
                action,
                ...args
            }), adminOrigin);
        });
    }

    const api = {
        async getUser() {
            const result = await callApi('getUser');
            if (!result || !result.users) {
                return null;
            }
            return result.users[0];
        },
        async hideComment(id: string) {
            return await callApi('hideComment', {id});
        },
        async showComment(id: string) {
            return await callApi('showComment', {id});
        },

        async browse({page, postId, order}: {page: number, postId: string, order?: string}) {
            let filter = null;
            if (firstCommentCreatedAt && !order) {
                filter = `created_at:<=${firstCommentCreatedAt}`;
            }

            const params = new URLSearchParams();

            params.set('limit', '20');
            if (filter) {
                params.set('filter', filter);
            }
            params.set('page', page.toString());
            if (order) {
                params.set('order', order);
            }

            const response = await callApi('browseComments', {postId, params: params.toString()});
            // const url = endpointFor({type: 'members', resource: `comments/post/${postId}`, params: `?${params.toString()}`});
            // const response = makeRequest({
            //     url,
            //     method: 'GET',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     credentials: 'same-origin'
            // }).then(function (res) {
            //     if (res.ok) {
            //         return res.json();
            //     } else {
            //         throw new Error('Failed to fetch comments');
            //     }
            // });

            // if (!firstCommentCreatedAt) {
            //     response.then((body:any) => {
            //         const firstComment = body.comments[0];
            //         if (firstComment) {
            //             firstCommentCreatedAt = firstComment.created_at;
            //         }
            //     });
            // }

            return response;
        }
    };

    return api;
}
export type AdminApi = ReturnType<typeof setupAdminAPI>;

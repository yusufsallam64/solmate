import toast, { ToastBar, Toaster } from "react-hot-toast"

const ToastWrapper = () => {
    return (
        <Toaster 
            position="top-right"
            reverseOrder={false}
            gutter={3}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
                // Define default options
                className: 'bg-accent-600',
                duration: 5000,
                success : {
                    style: {
                        background: "#26b434",
                        border: "1px solid hsl(126, 65%, 50%, 0.95)",
                        color: "hsl(270, 12%, 96%)"
                    }
                },
                error : {
                    style: {
                        background: "hsl(0, 80%, 56%, 0.95)",
                        border: "1px solid hsl(0, 80%, 46%)",
                        color: "hsl(270, 12%, 96%)",
                    },
                },
            }}
            >
            {(t) => (
                <ToastBar toast={t}>
                {({ message }) => (
                    <>
                    {message}
                    {t.type !== 'loading' && (
                        <button className="text-lg pb-1" onClick={() => toast.dismiss(t.id)}>✕</button>
                    )}
                    </>
                )}
                </ToastBar>
            )}
        </Toaster>   
    )
}

export default ToastWrapper;
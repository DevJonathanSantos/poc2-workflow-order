import { useState, useEffect } from "react";
import axios from "axios";

function App() {
    const [order, setOrder] = useState("");
    const [jobId, setJobId] = useState("");
    const [status, setStatus] = useState("");
    const [result, setResult] = useState("");

    useEffect(() => {
        let interval;

        if (jobId) {
            interval = setInterval(async () => {
                try {
                    const response = await axios.get(`http://localhost:3001/order/${jobId}`);
                    setStatus(response.data.status);
                    if (response.data.status === "Processed") {
                        setResult(response.data.result);
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error("Error while checking order status:", error);
                }
            }, 2000); // Polling every 2 seconds
        }

        return () => {
            clearInterval(interval);
        };
    }, [jobId]);

    const submitOrder = async () => {
        try {
            const response = await axios.post("http://localhost:3001/order", { order });
            setJobId(response.data.jobId);
            setStatus("Processing... Please wait.");
        } catch (error) {
            console.error("Error submitting order:", error);
        }
    };

    return (
        <div style={styles.container}>
            <h1>Order Processing App - Polling</h1>
            <input
                type="text"
                placeholder="Enter your order"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                style={styles.input}
            />
            <button onClick={submitOrder} style={styles.button}>Submit Order</button>

            {jobId && <p><strong>Job ID:</strong> {jobId}</p>}
            {status && <p><strong>Status:</strong> {status}</p>}
            {result && (
                <div style={styles.resultContainer}>
                    <p style={styles.resultText}><strong>Result:</strong></p>
                    <pre style={styles.resultData}>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: "20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
    },
    input: {
        padding: "10px",
        fontSize: "16px",
        marginBottom: "10px",
        width: "80%",
        maxWidth: "400px",
        borderRadius: "5px",
        border: "1px solid #ccc",
    },
    button: {
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        transition: "background-color 0.3s",
    },
    resultContainer: {
        marginTop: "20px",
        padding: "20px",
        backgroundColor: "#f0f8ff",
        borderRadius: "8px",
        border: "1px solid #007bff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        width: "80%",
        maxWidth: "600px",
        textAlign: "left",
    },
    resultText: {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#007bff",
        marginBottom: "10px",
    },
    resultData: {
        fontSize: "16px",
        color: "#333",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
    },
};

export default App;

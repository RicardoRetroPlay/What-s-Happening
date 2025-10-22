
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

const TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event));
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    
    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    try {
        const body = JSON.parse(event.body);
        const { email, action } = body;
        
        if (!email || !isValidEmail(email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    message: 'Valid email is required' 
                })
            };
        }
        
        if (action === 'subscribe') {
            // Subscribe to SNS topic
            const params = {
                Protocol: 'email',
                TopicArn: TOPIC_ARN,
                Endpoint: email
            };
            
            await sns.subscribe(params).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true,
                    message: 'Subscription request sent! Please check your email to confirm.',
                    email
                })
            };
            
        } else if (action === 'unsubscribe') {
            // List subscriptions to find the one to delete
            const subscriptions = await sns.listSubscriptionsByTopic({
                TopicArn: TOPIC_ARN
            }).promise();
            
            const subscription = subscriptions.Subscriptions.find(
                sub => sub.Endpoint === email && sub.Protocol === 'email'
            );
            
            if (subscription && subscription.SubscriptionArn !== 'PendingConfirmation') {
                await sns.unsubscribe({
                    SubscriptionArn: subscription.SubscriptionArn
                }).promise();
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true,
                        message: 'Successfully unsubscribed',
                        email
                    })
                };
            } else {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        message: 'Subscription not found or pending confirmation'
                    })
                };
            }
        } else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    message: 'Invalid action. Use "subscribe" or "unsubscribe"'
                })
            };
        }
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                message: 'Operation failed',
                error: error.message 
            })
        };
    }
};

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}